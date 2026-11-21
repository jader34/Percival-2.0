import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppState, parseBackup, serialize, applyAction, undo, getSheet } from '../src/session/state.ts';

test('ficha inicial confirma Percepção humana com bônus +4 e passiva 14', () => {
  const state = createAppState();
  const sheet = getSheet(state);
  assert.equal(state.record.creation.extraHumanSkill, 'perception');
  assert.equal(sheet.skills.perception.proficient, true);
  assert.equal(sheet.skills.perception.bonus, 4);
  assert.equal(sheet.passivePerception, 14);
  assert.ok(!sheet.warnings.some(w => w.code === 'human-skill'));
});

test('Percepção preenche saves sem escolha e histórico sem perder sessão ou escolhas explícitas', () => {
  let old = applyAction(createAppState(), { type: 'hp', mode: 'damage', amount: 13 });
  old = applyAction(old, { type: 'smite', slotLevel: 1 });
  old = applyAction(old, { type: 'notes', value: 'Manter recursos e histórico.' });
  for (const snapshot of [old, ...old.history]) snapshot.record.creation.extraHumanSkill = null;
  old.history[0].record.creation.extraHumanSkill = 'stealth';
  const before = structuredClone(old);
  const expected = structuredClone(old);
  for (const snapshot of [expected, ...expected.history]) {
    if (snapshot.record.creation.extraHumanSkill === null) snapshot.record.creation.extraHumanSkill = 'perception';
  }
  const migrated = parseBackup(JSON.stringify(old));
  assert.deepEqual(migrated, expected);
  assert.deepEqual(old, before);
  assert.equal(serialize(old), serialize(migrated));
  assert.deepEqual(parseBackup(serialize(migrated)), migrated);
  assert.equal(getSheet(migrated).skills.perception.bonus, 4);
  assert.equal(getSheet(migrated).passivePerception, 14);
  assert.equal(undo(old).record.creation.extraHumanSkill, 'perception');
  assert.deepEqual(undo(old).session, old.history.at(-1).session);
  assert.equal(applyAction(old, { type: 'notes', value: 'Nova nota' }).record.creation.extraHumanSkill, 'perception');
  const chosen = applyAction(migrated, { type: 'human-skill', skill: 'stealth' });
  assert.equal(parseBackup(serialize(chosen)).record.creation.extraHumanSkill, 'stealth');
  assert.equal(undo(chosen).record.creation.extraHumanSkill, 'perception');
});

const granted = ['warding-bond', 'prayer-of-healing', 'gentle-repose'];
function legacyState() {
  let state = createAppState();
  state.record.preparedSpellIds = ['bless'];
  state = applyAction(state, { type: 'use-resource', resource: 'amuletChannelDivinity' });
  state = applyAction(state, { type: 'cast', spellId: 'bless', slotLevel: 1, concentration: true });
  state = applyAction(state, { type: 'hp', mode: 'damage', amount: 13 });
  state = applyAction(state, { type: 'notes', value: 'Preservar a sessão.' });
  for (const snapshot of [state, ...state.history]) {
    snapshot.record.equipment.find(i => i.id === 'amulet-of-the-devout').attuned = null;
    snapshot.record.additionalSpellAccess = { 'warding-bond': false, 'prayer-of-healing': null };
  }
  return state;
}
function confirmed(record) {
  assert.equal(record.equipment.find(i => i.id === 'amulet-of-the-devout').attuned, true);
  for (const id of granted) assert.equal(record.additionalSpellAccess[id], true);
}

test('save antigo com cota cheia preserva seleções e permite corrigir o excesso sem reset', () => {
  const old = legacyState();
  const prepared = ['bless', 'command', 'cure-wounds', 'thunderous-smite', 'shield-of-faith', 'lesser-restoration', 'aid', 'warding-bond'];
  old.record.preparedSpellIds = prepared;
  old.history[0].record.preparedSpellIds = [...prepared];
  const migrated = parseBackup(JSON.stringify(old));
  confirmed(migrated.record);
  assert.deepEqual(migrated.record.preparedSpellIds, prepared);
  assert.deepEqual(migrated.session, old.session);
  assert.equal(migrated.history.length, old.history.length);
  assert.ok(getSheet(migrated).warnings.some(w => w.code === 'prepared-limit'));
  assert.throws(() => applyAction(migrated, { type: 'prepare', spellId: 'prayer-of-healing' }), /Limite/);
  assert.throws(() => applyAction(migrated, { type: 'cast', spellId: 'warding-bond', slotLevel: 2, concentration: false }), /Limite/);
  const fixed = applyAction(migrated, { type: 'prepare', spellId: 'aid' });
  assert.equal(getSheet(fixed).spellcasting.preparedCount, 7);
  assert.ok(!getSheet(fixed).warnings.some(w => w.code === 'prepared-limit'));
  assert.deepEqual(parseBackup(serialize(fixed)), fixed);
  assert.deepEqual(undo(fixed).record.preparedSpellIds, prepared);
});

test('ações e desfazer não revogam confirmações; reconfirmar não cria histórico nem recarrega', () => {
  const old = legacyState();
  const normalized = parseBackup(JSON.stringify(old));
  assert.equal(serialize(old), serialize(normalized));
  confirmed(undo(old).record);
  confirmed(applyAction(old, { type: 'notes', value: 'Nova nota' }).record);
  for (const action of [
    { type: 'attunement', value: false },
    ...granted.map(id => ({ type: 'grant-spell', id, allowed: false })),
  ]) assert.throws(() => applyAction(normalized, action), /permanente/i);
  for (const action of [
    { type: 'attunement', value: true },
    ...granted.map(id => ({ type: 'grant-spell', id, allowed: true })),
  ]) assert.deepEqual(applyAction(normalized, action), normalized);
  const removed = applyAction(normalized, { type: 'equipment', id: 'amulet-of-the-devout', equipped: false });
  assert.equal(getSheet(removed).spellcasting.itemBonus, 0);
  const equipped = applyAction(removed, { type: 'equipment', id: 'amulet-of-the-devout', equipped: true });
  confirmed(equipped.record);
  assert.equal(equipped.session.resourceSpent.amuletChannelDivinity, 1);
});

test('importar save antigo fixa confirmações em todos os snapshots sem alterar sessão ou preparação', () => {
  const old = legacyState();
  const imported = parseBackup(JSON.stringify(old));
  confirmed(imported.record);
  assert.equal(imported.history.length, old.history.length);
  for (const [index, snapshot] of [imported, ...imported.history].entries()) {
    confirmed(snapshot.record);
    const before = [old, ...old.history][index];
    assert.deepEqual(snapshot.session, before.session);
    const expected = structuredClone(before.record);
    expected.equipment.find(i => i.id === 'amulet-of-the-devout').attuned = true;
    expected.additionalSpellAccess = Object.fromEntries(granted.map(id => [id, true]));
    assert.deepEqual(snapshot.record, expected);
  }
  assert.deepEqual(imported.log, old.log);
  assert.deepEqual(parseBackup(serialize(imported)), imported);
  const sheet = getSheet(imported);
  assert.equal(sheet.spellcasting.saveDC, 16);
  assert.equal(sheet.spellcasting.attackBonus, 8);
  assert.equal(sheet.spellcasting.itemBonus, 1);
  assert.equal(sheet.attacks.halberd.toHit, 6);
  assert.equal(sheet.spellcasting.preparedCount, 1);
  assert.throws(() => applyAction(imported, { type: 'use-resource', resource: 'amuletChannelDivinity' }), /insuficiente/);
  const undone = undo(imported);
  confirmed(undone.record);
  assert.deepEqual(undone.session, old.history.at(-1).session);
});
