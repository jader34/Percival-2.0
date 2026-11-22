import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppState, applyAction, undo, serialize, parseBackup } from '../src/session/state.ts';
import { compareAndSwap, decode } from '../src/cloud/sync.ts';
test('gastar cada denominação até zero sem câmbio e desfazer o gasto', () => {
  for (const coin of Object.keys(createAppState().record.coins)) {
    const initial = createAppState();
    initial.record.coins[coin] = 17;
    const next = applyAction(freeze(initial), { type: 'coins', mode: 'spend', coin, amount: 17 });
    assert.deepEqual(next.record.coins, { ...initial.record.coins, [coin]: 0 });
    assert.match(next.log[0], /Gasto: 17 de (ouro|prata|cobre)/);
    assert.deepEqual(undo(next).record, initial.record);
  }
});

test('moedas rejeitam saldo insuficiente, overflow, quantidades e seleções inválidas atomicamente', () => {
  const state = freeze(createAppState());
  const before = serialize(state);
  for (const mode of ['receive', 'spend']) {
    for (const amount of [0, -1, 0.5, NaN, Infinity, '2', null, undefined, Number.MAX_SAFE_INTEGER + 1]) {
      assert.throws(() => applyAction(state, { type: 'coins', mode, coin: 'gp', amount }), /inteiro/);
    }
  }
  assert.throws(() => applyAction(state, { type: 'coins', mode: 'spend', coin: 'gp', amount: state.record.coins.gp + 1 }), /Saldo insuficiente/);
  assert.throws(() => applyAction(state, { type: 'coins', mode: 'receive', coin: 'gp', amount: Number.MAX_SAFE_INTEGER }), /limite seguro/);
  for (const coin of ['pp', '__proto__', 'toString', null]) {
    assert.throws(() => applyAction(state, { type: 'coins', mode: 'receive', coin, amount: 1 }), /Moeda inválida/);
  }
  assert.throws(() => applyAction(state, { type: 'coins', mode: 'oops', coin: 'gp', amount: 1 }), /Operação de moedas inválida/);
  assert.equal(serialize(state), before);
  const max = createAppState(); max.record.coins.gp = Number.MAX_SAFE_INTEGER - 1;
  assert.equal(applyAction(max, { type: 'coins', mode: 'receive', coin: 'gp', amount: 1 }).record.coins.gp, Number.MAX_SAFE_INTEGER);
});

const freeze = value => { Object.freeze(value); for (const child of Object.values(value)) if (child && typeof child === 'object') freeze(child); return value; };

test('receber cada moeda preserva outras denominações, sessão, pureza, histórico e backup/cloud', () => {
  for (const coin of Object.keys(createAppState().record.coins)) {
    const initial = freeze(createAppState());
    const next = applyAction(initial, { type: 'coins', mode: 'receive', coin, amount: 7 });
    assert.deepEqual(next.record.coins, { ...initial.record.coins, [coin]: initial.record.coins[coin] + 7 });
    assert.deepEqual(next.session, initial.session);
    assert.equal(initial.history.length, 0);
    assert.equal(next.history.length, 1);
    assert.match(next.log[0], /Recebido: 7 de (ouro|prata|cobre)/);
    assert.match(next.log[0], /Saldo:/);
    const loaded = parseBackup(serialize(next));
    assert.deepEqual(loaded, next);
    assert.deepEqual(undo(loaded).record, initial.record);
    const envelope = compareAndSwap(null, null, serialize(next));
    assert.deepEqual(parseBackup(decode(envelope).payload), next);
    assert.deepEqual(parseBackup(serialize(initial)), initial);
  }
});
