import test from 'node:test';
import assert from 'node:assert/strict';
const config = await import('../src/cloud/config.ts').catch(() => ({}));
test('configuração pública extrai URL de marcação e mantém rede bloqueada até regras fechadas', () => {
  assert.equal(config.FIREBASE_SYNC_ENABLED, false);
  assert.equal(config.firebaseConfig.databaseURL, 'https://percival2-4650c-default-rtdb.firebaseio.com');
  assert.doesNotThrow(() => new URL(config.firebaseConfig.databaseURL));
  assert.equal(config.firebaseConfig.projectId, 'percival2-4650c');
  assert.equal('measurementId' in config.firebaseConfig, false);
});
test('adaptador recusa inicializar SDK enquanto ativação segura está pendente', async () => {
  const client = await import('../src/cloud/firebase.ts').catch(() => ({}));
  assert.equal(typeof client.connectFirebase, 'function');
  await assert.rejects(client.connectFirebase(), /regras/);
});
test('erros do Google têm mensagens acionáveis sem perder ficha local', async () => {
  const { authMessage } = await import('../src/cloud/firebase.ts');
  assert.match(authMessage({ code: 'auth/popup-closed-by-user' }), /cancelada/);
  assert.match(authMessage({ code: 'auth/popup-blocked' }), /pop-ups/);
  assert.match(authMessage({ code: 'auth/unauthorized-domain' }), /domínio/);
  assert.match(authMessage({ code: 'auth/network-request-failed' }), /localmente/);
  assert.match(authMessage({ code: 'auth/operation-not-allowed' }), /habilitado/);
  assert.match(authMessage(new Error('unexpected')), /preservada/);
});
test('filtro de UX exige proprietário verificado com provedor Google', async () => {
  const api = await import('../src/cloud/identity.ts').catch(() => ({}));
  assert.equal(typeof api.isOwner, 'function');
  const user = { email: 'lavytraveco@gmail.com', emailVerified: true, providerData: [{ providerId: 'google.com' }] };
  assert.equal(api.isOwner(user), true);
  assert.equal(api.isOwner(null), false);
  assert.equal(api.isOwner({ ...user, email: 'outra@gmail.com' }), false);
  assert.equal(api.isOwner({ ...user, emailVerified: false }), false);
  assert.equal(api.isOwner({ ...user, providerData: [{ providerId: 'password' }] }), false);
});
