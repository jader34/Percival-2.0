import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createAppState } from '../src/session/state.ts';
const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
dom.window.scrollTo = () => {};
dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
dom.window.HTMLDialogElement.prototype.close = function () { this.open = false; };
const { createRoot } = await import('react-dom/client');
const { default: App } = await import('../src/App.tsx');
const button = (text: string) => [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === text);
async function click(text: string) { assert.ok(button(text), `Botão ausente: ${text}`); await act(async () => button(text)!.click()); }
async function input(id: string, value: string) {
  await act(async () => {
    const el = document.getElementById(id)!;
    const prototype = el.tagName === 'SELECT' ? dom.window.HTMLSelectElement.prototype : dom.window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(el, value);
    el.dispatchEvent(new dom.window.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
}
const saved = () => JSON.parse(localStorage.getItem('percival-session-v1')!);
test('receber/gastar pela UI salva, desfaz, valida e informa a moeda sem conversão', async () => {
  localStorage.clear();
  let root = createRoot(document.getElementById('root')!);
  try {
    await act(async () => root.render(<App />));
    await click('Inventário');
    const increase = document.querySelector<HTMLButtonElement>('button[aria-label="Aumentar quantidade de Rações de Viagem"]');
    assert.ok(increase);
    await act(async () => increase.click());
    assert.match([...document.querySelectorAll('[role="status"]')].map(el => el.textContent).join(' '), /Rações de Viagem: quantidade/);
    await click('Receber moedas');
    assert.ok(button('Confirmar recebimento')!.disabled);
    await input('coin-kind', 'sp'); await input('coin-amount', '7');
    assert.match(document.querySelector('.coin-preview')!.textContent!, /52/);
    await click('Confirmar recebimento');
    assert.equal(saved().record.coins.sp, 52);
    assert.match(document.body.textContent!, /Recebido: 7 de prata/);
    await click('Gastar moedas'); await input('coin-kind', 'sp');
    for (const value of ['0', '-1', '1.5', '1e2', '9007199254740992']) {
      await input('coin-amount', value);
      assert.ok(button('Confirmar gasto')!.disabled);
      assert.match(document.getElementById('coin-error')!.textContent!, /inteiro/);
    }
    await input('coin-amount', '53');
    assert.match(document.getElementById('coin-error')!.textContent!, /Saldo insuficiente/);
    assert.ok(button('Confirmar gasto')!.disabled);
    await input('coin-amount', '52'); await click('Confirmar gasto');
    assert.equal(saved().record.coins.sp, 0);
    assert.equal(saved().record.coins.gp, createAppState().record.coins.gp);
    await click('Desfazer'); assert.equal(saved().record.coins.sp, 52);
    await act(async () => root.unmount());
    root = createRoot(document.getElementById('root')!);
    await act(async () => root.render(<App />));
    await click('Inventário');
    assert.match(document.querySelector('.coin-strip')!.textContent!, /52prata/);
    await click('Receber moedas'); await input('coin-amount', String(Number.MAX_SAFE_INTEGER));
    assert.match(document.getElementById('coin-error')!.textContent!, /limite seguro/);
    assert.ok(button('Confirmar recebimento')!.disabled);
  } finally { await act(async () => root.unmount()); }
});
