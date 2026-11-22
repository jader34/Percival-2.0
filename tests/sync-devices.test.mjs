import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppState, serialize, applyAction, parseBackup, undo } from '../src/session/state.ts';
import { SyncSession, compareAndSwap, decode, reconcile } from '../src/cloud/sync.ts';

const original = serialize(createAppState());
const notes = text => serialize(applyAction(createAppState(), { type: 'notes', value: text }));
const envelope = (revision, payload = original) => ({ revision, payload });
const tick = () => new Promise(resolve => setImmediate(resolve));

// Shared server, separate device storage and listeners; commits are explicitly
// scheduled to exercise concurrent CAS and delayed acknowledgements deterministically.
function server(initial = envelope(1)) {
  let remote = initial;
  const clients = new Set(), pending = [];
  function device({ local = original, base = initial, failArchive = false, failAdopt = false, failBase = false } = {}) {
    const disk = { local, base: base ? JSON.stringify(base) : null, archives: [] };
    const statuses = [], adopted = [];
    const client = { online: true, active: true, receive: null, connection: null, error: null };
    clients.add(client);
    const sync = new SyncSession({ local, base: disk.base ? decode(JSON.parse(disk.base)) : null,
      status: status => statuses.push(status),
      archive: payload => { if (failArchive) throw Error('QuotaExceeded'); disk.archives.push(payload); },
      saveBase: value => { if (failBase) throw Error('QuotaExceeded'); disk.base = JSON.stringify(value); },
      adopt: payload => { if (failAdopt) throw Error('QuotaExceeded'); disk.local = payload; adopted.push(payload); },
      transport: {
        subscribe(receive, connection, error) {
          Object.assign(client, { receive, connection, error });
          connection(true); receive(remote);
          return () => { client.active = false; };
        },
        cas: (expected, payload) => new Promise(resolve => pending.push({ expected, payload, resolve })),
      },
    });
    sync.start();
    return { sync, disk, statuses, adopted, client,
      edit(payload, paused = false) { disk.local = payload; sync.update(payload, paused); },
      offline() { client.online = false; client.connection(false); },
      reconnect() { client.online = true; client.receive(remote); client.connection(true); },
    };
  }
  function publish(value) {
    remote = value;
    for (const client of clients) if (client.active && client.online) client.receive(remote);
  }
  return { device, pending, publish, get remote() { return remote; },
    commit({ delayReceipt = false } = {}) {
      const job = pending.shift(); assert.ok(job, 'expected a pending transaction');
      const next = compareAndSwap(remote, job.expected, job.payload);
      if (next) publish(next);
      const receipt = { committed: !!next, value: next ?? remote };
      const acknowledge = () => job.resolve(receipt);
      if (!delayReceipt) acknowledge();
      return acknowledge;
    },
  };
}

test('dois aparelhos recebem alterações sequenciais sem escolha nem eco de escrita', async () => {
  const s = server(), pc = s.device(), phone = s.device();
  pc.edit(notes('PC')); s.commit(); await tick();
  assert.equal(phone.disk.local, notes('PC')); assert.equal(s.pending.length, 0);
  phone.edit(notes('celular')); s.commit(); await tick();
  assert.equal(pc.disk.local, notes('celular')); assert.equal(s.pending.length, 0);
  assert.equal(pc.statuses.at(-1).kind, 'synced'); assert.equal(phone.statuses.at(-1).kind, 'synced');
  assert.deepEqual(phone.disk.archives, [original]);
  assert.deepEqual(pc.disk.archives, [notes('PC')]);
});

test('moedas recebidas, gastas e desfeitas sincronizam automaticamente entre aparelhos simulados', async () => {
  const s = server(), pc = s.device(), phone = s.device();
  const received = applyAction(createAppState(), { type: 'coins', mode: 'receive', coin: 'gp', amount: 9 });
  pc.edit(serialize(received)); s.commit(); await tick();
  assert.deepEqual(parseBackup(phone.disk.local), received);
  const spent = applyAction(parseBackup(phone.disk.local), { type: 'coins', mode: 'spend', coin: 'cp', amount: 3 });
  phone.edit(serialize(spent)); s.commit(); await tick();
  assert.deepEqual(parseBackup(pc.disk.local), spent);
  const undone = undo(parseBackup(pc.disk.local));
  pc.edit(serialize(undone)); s.commit(); await tick();
  assert.deepEqual(parseBackup(phone.disk.local), undone);
  assert.equal(s.pending.length, 0);
  assert.equal(phone.statuses.at(-1).kind, 'synced');
  pc.sync.stop(); phone.sync.stop();
});

test('base persistida permite receber após reiniciar; sem base não destrói ficha diferente', () => {
  const s = server(), first = s.device(); first.sync.stop();
  s.publish(envelope(2, notes('enquanto fechado')));
  const reopened = s.device({ local: first.disk.local, base: decode(JSON.parse(first.disk.base)) });
  assert.equal(reopened.disk.local, notes('enquanto fechado'));
  const unknown = s.device({ local: notes('sem base'), base: null });
  assert.equal(unknown.disk.local, notes('sem base')); assert.equal(unknown.statuses.at(-1).kind, 'conflict');
  assert.equal(s.pending.length, 0);
});

test('edições concorrentes offline preservam as duas versões e escolha arquiva a substituída', async () => {
  const s = server(), pc = s.device(), phone = s.device(); phone.offline();
  phone.edit(notes('offline')); pc.edit(notes('online')); s.commit(); await tick();
  phone.reconnect();
  assert.equal(phone.statuses.at(-1).kind, 'conflict'); assert.equal(phone.disk.local, notes('offline'));
  assert.equal(s.pending.length, 0);
  phone.sync.keepLocal(); s.commit(); await tick();
  assert.deepEqual(phone.disk.archives, [notes('online')]);
  assert.equal(pc.disk.local, notes('offline'));
});

test('CAS simultâneo não sobrescreve vencedor e não reenvia perdedor em loop', async () => {
  const s = server(), a = s.device(), b = s.device();
  a.edit(notes('A')); b.edit(notes('B')); assert.equal(s.pending.length, 2);
  s.commit(); s.commit(); await tick();
  assert.equal(s.remote.payload, notes('A')); assert.equal(b.disk.local, notes('B'));
  assert.equal(b.statuses.at(-1).kind, 'conflict'); assert.equal(s.pending.length, 0);
  b.sync.useRemote(); assert.equal(b.disk.local, notes('A'));
  assert.deepEqual(b.disk.archives, [notes('B')]);
});

test('rascunho bloqueia notificações e retoma apenas a última quando descartado', () => {
  const s = server(), d = s.device(); d.edit(original, true);
  s.publish(envelope(2, notes('um'))); s.publish(envelope(3, notes('dois')));
  assert.equal(d.disk.local, original); assert.deepEqual(d.adopted, []);
  d.sync.useRemote(); d.sync.keepLocal(); assert.equal(s.pending.length, 0);
  d.edit(original, false);
  assert.deepEqual(d.adopted, [notes('dois')]); assert.deepEqual(d.disk.archives, [original]);
  s.publish(envelope(3, notes('dois')));
  assert.equal(d.adopted.length, 1); assert.equal(d.disk.archives.length, 1);
});

test('salvar rascunho após atualização remota cria conflito em vez de apagar notas', () => {
  const s = server(), d = s.device(); d.edit(original, true);
  s.publish(envelope(2, notes('remoto'))); d.edit(notes('rascunho salvo'), false);
  assert.equal(d.statuses.at(-1).kind, 'conflict'); assert.equal(d.disk.local, notes('rascunho salvo'));
  assert.equal(d.adopted.length, 0); assert.equal(s.pending.length, 0);
});

test('confirmação tardia recebe última revisão sem perder edições feitas durante envio', async () => {
  const s = server(), d = s.device(); d.edit(notes('enviado'));
  const ack = s.commit({ delayReceipt: true });
  d.edit(notes('edição durante envio'));
  s.publish(envelope(3, notes('outro'))); s.publish(envelope(4, notes('último')));
  ack(); await tick();
  assert.equal(d.statuses.at(-1).kind, 'conflict'); assert.equal(d.disk.local, notes('edição durante envio'));
  assert.equal(d.sync.remoteBackup(), notes('último')); assert.equal(s.pending.length, 0);
});

test('rascunho iniciado durante envio impede recepção mesmo após confirmação tardia', async () => {
  const s = server(), d = s.device(); d.edit(notes('enviado'));
  const ack = s.commit({ delayReceipt: true }); d.edit(notes('enviado'), true);
  s.publish(envelope(3, notes('novo'))); ack(); await tick();
  assert.equal(d.adopted.length, 0); assert.equal(d.disk.local, notes('enviado'));
  d.edit(notes('enviado'), false); assert.equal(d.disk.local, notes('novo'));
});

for (const failure of ['failArchive', 'failAdopt']) {
  test(`${failure}: recepção automática falha fechada sem destruir local nem avançar base`, () => {
    const s = server(), d = s.device({ [failure]: true }); s.publish(envelope(2, notes('novo')));
    assert.equal(d.disk.local, original); assert.equal(decode(JSON.parse(d.disk.base)).revision, 1);
    assert.equal(d.statuses.at(-1).kind, 'error'); assert.equal(s.pending.length, 0);
    d.reconnect(); d.edit(notes('depois')); assert.equal(s.pending.length, 0);
  });
}

test('falha ao persistir base não envia e mantém dados recuperáveis', () => {
  const s = server(), d = s.device({ failBase: true }); s.publish(envelope(2, notes('novo')));
  assert.equal(d.disk.local, original); assert.equal(d.statuses.at(-1).kind, 'error');
  assert.equal(s.pending.length, 0);
});

test('logout ignora valor, conexão, erro e confirmação antigos', async () => {
  const s = server(), d = s.device(); d.edit(notes('enviado'));
  const ack = s.commit({ delayReceipt: true }); d.sync.stop(); const count = d.statuses.length;
  d.client.receive(envelope(5, notes('tardio'))); d.client.connection(true); d.client.error(Error('late'));
  ack(); await tick();
  assert.equal(d.statuses.length, count); assert.equal(d.adopted.length, 0);
  assert.equal(decode(JSON.parse(d.disk.base)).revision, 1);
});

test('revisão regredida ou alterada na mesma revisão exige escolha', () => {
  assert.equal(reconcile(original, envelope(3), envelope(2, notes('antigo'))), 'conflict');
  assert.equal(reconcile(original, envelope(3), envelope(3, notes('inválido'))), 'conflict');
});
