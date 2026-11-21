import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createAppState, serialize, applyAction } from '../src/session/state.ts';
import { OWNER_EMAIL } from '../src/cloud/identity.ts';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document,
  localStorage: dom.window.localStorage, HTMLElement: dom.window.HTMLElement,
  IS_REACT_ACT_ENVIRONMENT: true });
dom.window.scrollTo = () => {};
const { createRoot } = await import('react-dom/client');
let receive: (value: unknown) => void;
let observe: (user: unknown) => void;
const writes: unknown[] = [];
mock.module('../src/cloud/config.ts', { exports: { FIREBASE_SYNC_ENABLED: true } });
mock.module('../src/cloud/firebase.ts', { exports: {
  authMessage: () => 'Erro de teste',
  connectFirebase: async () => ({
    observe(next: typeof observe) { observe = next; next({ uid: 'test-owner', email: OWNER_EMAIL, emailVerified: true, providerData: [{ providerId: 'google.com' }] }); return () => {}; },
    transport: () => ({ subscribe(next: typeof receive, connected: (online: boolean) => void) {
      receive = next; connected(true); next({ revision: 1, payload: serialize(createAppState()) }); return () => {};
    }, cas: async (...args: unknown[]) => { writes.push(args); throw Error('Unexpected write'); } }),
    logout: async () => observe(null), login: async () => {},
  }),
} });
const { default: App } = await import('../src/App.tsx');
const { useCloud } = await import('../src/cloud/useCloud.ts');

test('edição local já renderizada não é sobrescrita por notificação antes dos efeitos passivos', async () => {
  localStorage.clear(); writes.length = 0;
  localStorage.setItem('percival-cloud-base-test-owner', JSON.stringify({ revision: 1, payload: serialize(createAppState()) }));
  const adopted: unknown[] = [];
  function Probe({ edited = false }: { edited?: boolean }) {
    const state = React.useMemo(() => edited ? applyAction(createAppState(), { type: 'notes', value: 'edição local' }) : createAppState(), [edited]);
    const cloud = useCloud(state, false, 'probe-local', next => adopted.push(next));
    React.useLayoutEffect(() => {
      if (edited) receive({ revision: 2, payload: serialize(applyAction(createAppState(), { type: 'notes', value: 'remoto' })) });
    }, [edited]);
    return <span>{cloud.status.kind}</span>;
  }
  const root = createRoot(document.getElementById('root')!);
  try {
    await act(async () => root.render(<Probe />));
    await act(async () => root.render(<Probe edited />));
    assert.equal(adopted.length, 0, 'estado local renderizado deve ser preservado');
  } finally { await act(async () => root.unmount()); }
});
const initial = createAppState();
const remote = (revision: number, value: string) => ({ revision, payload: serialize(applyAction(initial, { type: 'notes', value })) });
const button = (text: string) => [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === text)!;
async function click(text: string) { await act(async () => button(text).click()); }
async function typeNotes(value: string) {
  await act(async () => {
    const input = document.querySelector('textarea')!;
    Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, 'value')!.set!.call(input, value);
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
}
async function mount() {
  localStorage.clear(); writes.length = 0;
  localStorage.setItem('percival-cloud-base-test-owner', JSON.stringify({ revision: 1, payload: serialize(initial) }));
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(<App />));
  await click('Ficha');
  return root;
}

test('App preserva rascunho ao receber e apresenta conflito ao salvar', async () => {
  const root = await mount();
  try {
    await typeNotes('minhas notas');
    await act(async () => receive(remote(2, 'notas remotas')));
    assert.equal(document.querySelector('textarea')!.value, 'minhas notas');
    assert.match(document.body.textContent!, /Sincronização pausada/);
    assert.equal(writes.length, 0);
    await click('Salvar notas');
    assert.equal(document.querySelector('textarea')!.value, 'minhas notas');
    assert.match(document.body.textContent!, /Conflito entre versões/);
    assert.equal(writes.length, 0);
  } finally { await act(async () => root.unmount()); }
});

test('App aplica rajada remota uma vez por revisão e não reenvia estado antigo', async () => {
  const root = await mount();
  try {
    await act(async () => { receive(remote(2, 'segunda')); receive(remote(3, 'terceira')); receive(remote(3, 'terceira')); });
    assert.equal(document.querySelector('textarea')!.value, 'terceira');
    assert.equal(JSON.parse(localStorage.getItem('percival-session-v1')!).session.notes, 'terceira');
    assert.equal(JSON.parse(localStorage.getItem('percival-cloud-base-test-owner')!).revision, 3);
    assert.equal(Object.keys(localStorage).filter(key => key.startsWith('percival-cloud-recovery-')).length, 2);
    assert.equal(writes.length, 0);
    await click('Sair da conta');
    await act(async () => receive(remote(4, 'depois do logout')));
    assert.equal(document.querySelector('textarea')!.value, 'terceira');
  } finally { await act(async () => root.unmount()); }
});

test('painel explica recepção automática e proteção de rascunhos', async () => {
  const root = await mount();
  try { assert.match(document.body.textContent!, /Atualizações de outros aparelhos chegam automaticamente quando não há edições locais nem notas em rascunho/); }
  finally { await act(async () => root.unmount()); }
});

test('App recebe notas remotas após rascunho revertido, sem ressuscitar texto antigo', async () => {
  const root = await mount();
  try {
    await typeNotes('rascunho');
    assert.match(document.body.textContent!, /Rascunho não salvo/);
    await typeNotes(initial.session.notes);
    assert.doesNotMatch(document.body.textContent!, /Rascunho não salvo/);
    await act(async () => receive(remote(2, 'do celular')));
    assert.equal(document.querySelector('textarea')!.value, 'do celular');
    assert.doesNotMatch(document.body.textContent!, /Rascunho não salvo/);
    assert.equal(writes.length, 0);
  } finally { await act(async () => root.unmount()); }
});
