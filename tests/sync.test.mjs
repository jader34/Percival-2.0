import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppState, serialize, applyAction } from '../src/session/state.ts';
const api = await import('../src/cloud/sync.ts').catch(() => ({}));
const raw = () => serialize(createAppState());
const changed = (text) => serialize(applyAction(createAppState(), { type: 'notes', value: text }));
const env = (revision, payload = raw()) => ({ revision, payload });
test('reconciliação reconhece igualdade, edição local e divergência sem last-write-wins', () => {
  assert.equal(api.reconcile(raw(), null, env(1)), 'synced');
  assert.equal(api.reconcile(changed('local'), env(1), env(1)), 'push');
  assert.equal(api.reconcile(changed('local'), env(1), env(2, changed('outro'))), 'conflict');
  assert.equal(api.reconcile(raw(), null, env(2, changed('outro'))), 'conflict');
  assert.equal(api.reconcile(raw(), env(1), null), 'conflict');
});
test('transporte valida backup e CAS recusa revisão concorrente e preserva vazios', () => {
  assert.equal(typeof api.decode, 'function');
  assert.deepEqual(api.decode(env(1)), env(1));
  assert.throws(() => api.decode(env(1, '{}')));
  assert.throws(() => api.decode(env(-1)));
  assert.throws(() => api.decode({ ...env(1), extra: true }));
  const next = api.compareAndSwap(env(1), env(1), changed('salvo'));
  assert.equal(next.revision, 2);
  assert.deepEqual(JSON.parse(next.payload).record.advancements, []);
  assert.equal(api.compareAndSwap(env(2), env(1), raw()), undefined);
  assert.equal(api.compareAndSwap(env(1, changed('trocado')), env(1), raw()), undefined);
});
test('confirmações permanentes não causam conflito falso nem alteram envelope CAS antigo', async () => {
  const old = createAppState();
  old.record.equipment.find(i => i.id === 'amulet-of-the-devout').attuned = false;
  old.record.additionalSpellAccess = {};
  const base = env(1, JSON.stringify(old));
  assert.equal(api.reconcile(raw(), null, base), 'synced');
  assert.deepEqual(api.decode(base), base, 'CAS precisa dos bytes remotos originais.');
  assert.equal(api.reconcile(raw(), base, env(2, changed('remoto'))), 'pull');
  assert.equal(api.reconcile(changed('local'), base, env(2, changed('remoto'))), 'conflict');
  const h = harness(base); h.connect(true); h.emit(base);
  for (let i = 0; i < 3; i++) { h.sync.update(raw(), false); h.emit(base); }
  await tick();
  assert.equal(h.writes, 0);
  assert.equal(h.statuses.at(-1).kind, 'synced');
  h.sync.update(changed('edição real'), false);
  await tick();
  assert.equal(h.writes, 1);
  assert.equal(h.saved.at(-1).revision, 2);
  assert.equal(h.statuses.at(-1).kind, 'synced');
});
const tick = () => new Promise(resolve => setImmediate(resolve));
function harness(base = null) {
  let remote = base, receive, connection, writes = 0, adopted = null, stopped = false;
  const statuses = [], saved = [], archives = [];
  const transport = {
    subscribe: (onValue, onConnection) => { receive = onValue; connection = onConnection; return () => { stopped = true; }; },
    cas: async (expected, payload) => {
      writes++;
      const next = api.compareAndSwap(remote, expected, payload);
      if (next) remote = next;
      return { committed: !!next, value: remote };
    },
  };
  const sync = new api.SyncSession({ local: raw(), base, transport,
    status: (s) => statuses.push(s), saveBase: (b) => saved.push(b),
    archive: (text) => archives.push(text), adopt: text => { adopted = text; } });
  sync.start();
  return { sync, statuses, saved, archives, get writes() { return writes; }, get adopted() { return adopted; }, get stopped() { return stopped; },
    emit: value => { remote = value; receive(value); }, connect: value => connection(value) };
}
test('recebe atualização remota automaticamente quando a ficha local ainda é a base', () => {
  const h = harness(env(1)); h.connect(true); h.emit(env(1));
  h.emit(env(2, changed('outro aparelho')));
  assert.equal(h.adopted, changed('outro aparelho'));
  assert.deepEqual(h.archives, [raw()]);
  assert.deepEqual(h.saved.at(-1), env(2, changed('outro aparelho')));
  assert.equal(h.statuses.at(-1).kind, 'synced');
  assert.equal(h.writes, 0);
});
test('controlador lê antes de enviar, migra por escolha e não perde edição offline', async () => {
  assert.equal(typeof api.SyncSession, 'function');
  const h = harness();
  h.connect(true);
  h.sync.update(changed('local'), false);
  await tick(); assert.equal(h.writes, 0);
  h.emit(null); await tick(); assert.equal(h.writes, 0);
  assert.equal(h.statuses.at(-1).kind, 'migration');
  h.sync.keepLocal(); await tick(); assert.equal(h.writes, 1);
  assert.equal(h.statuses.at(-1).kind, 'synced');
  h.connect(false); h.sync.update(changed('offline'), false);
  await tick(); assert.equal(h.writes, 1);
  h.connect(true); await tick(); assert.equal(h.writes, 2);
  assert.equal(h.saved.at(-1).payload, changed('offline'));
});
test('conflito exige escolha; adotar nuvem arquiva local e respeita rascunhos', async () => {
  const h = harness(); h.connect(true); h.emit(env(2, changed('nuvem')));
  assert.equal(h.statuses.at(-1).kind, 'conflict'); assert.equal(h.writes, 0);
  h.sync.update(raw(), true);
  assert.equal(typeof h.sync.useRemote, 'function');
  h.sync.useRemote(); assert.equal(h.adopted, null);
  h.sync.update(raw(), false); h.sync.useRemote();
  assert.equal(h.adopted, changed('nuvem')); assert.deepEqual(h.archives, [raw()]);
  assert.equal(h.statuses.at(-1).kind, 'synced');
  h.sync.stop(); h.emit(env(3)); h.sync.update(changed('tarde'), false);
  await tick(); assert.equal(h.writes, 0); assert.equal(h.stopped, true);
});
test('registro remoto inválido bloqueia novas escritas mesmo após reconexão', async () => {
  const h = harness(env(1)); h.connect(true); h.emit(env(1));
  h.emit({ revision: 2, payload: '{}' });
  assert.equal(h.statuses.at(-1).kind, 'error');
  h.connect(false); h.sync.update(changed('aguardando'), false); h.connect(true);
  await tick(); assert.equal(h.writes, 0);
});
test('evento mais novo recebido durante commit não é ocultado pela confirmação antiga', async () => {
  let receive, resolve;
  const statuses = [], adopted = [];
  const session = new api.SyncSession({ local: changed('meu'), base: env(1),
    status: s => statuses.push(s), saveBase: () => {}, archive: () => {}, adopt: value => adopted.push(value),
    transport: { subscribe(value, connection) { receive = value; connection(true); return () => {}; },
      cas: () => new Promise(done => { resolve = done; }) } });
  session.start(); receive(env(1));
  receive(env(3, changed('mais novo')));
  resolve({ committed: true, value: env(2, changed('meu')) });
  await tick();
  assert.equal(statuses.at(-1).kind, 'synced');
  assert.deepEqual(adopted, [changed('mais novo')]);
  assert.equal(session.remoteBackup(), changed('mais novo'));
});
test('edições durante envio são reenviadas sem perder o payload mais recente', async () => {
  let receive, resolve; const writes = [], saved = [];
  const sync = new api.SyncSession({ local: changed('um'), base: env(1), status: () => {},
    saveBase: value => saved.push(value), archive: () => {}, adopt: () => {},
    transport: { subscribe(value, connection) { receive = value; connection(true); return () => {}; },
      cas: (expected, payload) => { writes.push(payload); return new Promise(done => { resolve = done; }); } } });
  sync.start(); receive(env(1)); sync.update(changed('dois'), false);
  resolve({ committed: true, value: env(2, changed('um')) }); await tick();
  assert.deepEqual(writes, [changed('um'), changed('dois')]);
  resolve({ committed: true, value: env(3, changed('dois')) }); await tick();
  assert.equal(saved.at(-1).payload, changed('dois'));
});
test('cancelamento descarta callbacks de uma transação tardia', async () => {
  let receive, resolve; const saved = [], statuses = [];
  const sync = new api.SyncSession({ local: changed('um'), base: env(1), status: s => statuses.push(s),
    saveBase: value => saved.push(value), archive: () => {}, adopt: () => {},
    transport: { subscribe(value, connection) { receive = value; connection(true); return () => {}; },
      cas: () => new Promise(done => { resolve = done; }) } });
  sync.start(); receive(env(1)); sync.stop(); const count = statuses.length;
  resolve({ committed: true, value: env(2, changed('um')) }); await tick();
  assert.equal(saved.length, 0); assert.equal(statuses.length, count);
});
test('falha de backup de recuperação impede substituir a ficha local', () => {
  let receive, adopted = false; const statuses = [];
  const sync = new api.SyncSession({ local: raw(), base: null, status: s => statuses.push(s),
    saveBase: () => {}, archive: () => { throw new Error('QuotaExceeded'); }, adopt: () => { adopted = true; },
    transport: { subscribe(value, connection) { receive = value; connection(true); return () => {}; },
      cas: async () => { throw new Error('não deveria escrever'); } } });
  sync.start(); receive(env(1, changed('remoto'))); sync.useRemote();
  assert.equal(adopted, false); assert.equal(statuses.at(-1).kind, 'error');
});
test('primeiro acesso nunca envia ficha padrão automaticamente', () => {
  assert.equal(typeof api.reconcile, 'function', 'reconciliação ainda não implementada');
  assert.equal(api.reconcile(raw(), null, null), 'migration');
});
