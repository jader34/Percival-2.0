import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { createAppState, serialize } from '../src/session/state.ts';

// Fail closed before creating any SDK context. Never use a real project here.
assert.equal(process.env.FIREBASE_DATABASE_EMULATOR_HOST, '127.0.0.1:9000',
  'Inicie o emulador local 127.0.0.1:9000 com projeto demo-percival; produção é proibida neste teste.');
let env;
const claims = { email: 'lavytraveco@gmail.com', email_verified: true, firebase: { sign_in_provider: 'google.com' } };
const data = (revision = 1) => ({ revision, payload: serialize(createAppState()) });
const owner = () => env.authenticatedContext('owner-uid', claims).database();
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-percival', database: {
    host: '127.0.0.1', port: 9000,
    rules: readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8'),
  } });
});
beforeEach(async () => env.clearDatabase());
after(async () => env?.cleanup());
test('proprietário Google verificado lê e grava apenas no próprio UID', async () => {
  const db = owner();
  await assertSucceeds(db.ref('sheets/owner-uid').set(data()));
  await assertSucceeds(db.ref('sheets/owner-uid').once('value'));
  await assertFails(db.ref('sheets/other-uid').set(data()));
  await assertFails(db.ref('sheets/other-uid').once('value'));
  await assertFails(db.ref('sheets').once('value'));
  await assertFails(db.ref('/').once('value'));
  await assertFails(db.ref('arbitrary').set(data()));
});
test('anônimo, outra conta, email não verificado e provedor não Google são negados', async () => {
  const contexts = [env.unauthenticatedContext(),
    env.authenticatedContext('owner-uid', { ...claims, email: 'other@example.com' }),
    env.authenticatedContext('owner-uid', { ...claims, email_verified: false }),
    env.authenticatedContext('owner-uid', { ...claims, firebase: { sign_in_provider: 'password' } }),
  ];
  for (const context of contexts) {
    await assertFails(context.database().ref('sheets/owner-uid').set(data()));
    await assertFails(context.database().ref('sheets/owner-uid').once('value'));
  }
});
test('revisão monotônica, esquema fechado e proibição de exclusão', async () => {
  const ref = owner().ref('sheets/owner-uid');
  await assertFails(ref.set(data(2)));
  await assertSucceeds(ref.set(data(1)));
  await assertFails(ref.set(data(1)));
  await assertFails(ref.set(data(3)));
  await assertFails(ref.set({ ...data(2), extra: true }));
  await assertFails(ref.set({ revision: 2, payload: {} }));
  await assertFails(ref.set({ revision: 2, payload: '' }));
  await assertFails(ref.set({ revision: 2, payload: 'x'.repeat(5_000_001) }));
  await assertFails(ref.set({ revision: 1.5, payload: 'x' }));
  await assertFails(ref.remove());
  await assertFails(ref.child('payload').remove());
  await assertSucceeds(ref.set(data(2)));
});
