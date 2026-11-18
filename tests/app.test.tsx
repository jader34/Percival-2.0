import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { Modal } from "../src/components/Modal.tsx";
import { Combat } from "../src/components/Combat.tsx";
import { ActionDialog } from "../src/components/ActionDialog.tsx";
import { applyAction, createAppState, getSheet } from "../src/session/state.ts";

test("a primeira tela mostra Percival, vida e navegação mobile sem dados virtuais", async () => {
  const component = await import("../src/App.tsx").catch(() => ({
    default: undefined,
  }));
  assert.equal(
    typeof component.default,
    "function",
    "A interface ainda não existe.",
  );
  const App = component.default!;
  const html = renderToStaticMarkup(<App />);
  for (const content of [
    "Percival",
    "64",
    "Combate",
    "Magias",
    "Inventário",
    "Ficha",
    "Registrar dano",
    "Curar",
    "Alabarda",
  ]) {
    assert.ok(html.includes(content), `Conteúdo essencial ausente: ${content}`);
  }
  assert.doesNotMatch(html, /Rolar d20|Rolar dados/);
  assert.match(html, /aria-label="Navegação principal"/);
});

test("a janela usa o cabeçalho e conteúdo estilizados para manter fechar acessível", () => {
  const html = renderToStaticMarkup(
    <Modal title="Dano" onClose={() => {}}>
      Confirmar
    </Modal>,
  );
  assert.match(html, /class="dialog-header"/);
  assert.match(html, /class="dialog-body"/);
});

test("Smite vem antes dos detalhes secundários dos ataques", () => {
  const state = createAppState();
  const html = renderToStaticMarkup(
    <Combat
      state={state}
      sheet={getSheet(state)}
      act={() => true}
      open={() => {}}
    />,
  );
  assert.ok(html.indexOf("smite-action") < html.indexOf("weapon-row"));
});

test("retirar o manto gasto não mostra uma reserva negativa", () => {
  let state = applyAction(createAppState(), { type: "veil" });
  state = applyAction(state, {
    type: "equipment",
    id: "blood-veil-cloak",
    equipped: false,
  });
  const html = renderToStaticMarkup(
    <Combat
      state={state}
      sheet={getSheet(state)}
      act={() => true}
      open={() => {}}
    />,
  );
  assert.doesNotMatch(html, />-1\/1</);
});

test("o sangue anima a propriedade realmente alterada pelo indicador de vida", () => {
  const css = readFileSync(
    new URL("../src/styles.css", import.meta.url),
    "utf8",
  );
  assert.match(css, /\.blood-liquid\s*\{[^}]*transition:\s*transform/);
});

test("erros da ação aparecem dentro da janela modal, não atrás dela", () => {
  const state = createAppState();
  const html = renderToStaticMarkup(<ActionDialog state={state} sheet={getSheet(state)}
    act={() => false} open={() => {}} dialog={{ kind: 'hands' }} close={() => {}}
    exportData={() => {}} importData={() => {}} storageIssue={null} recover={() => {}}
    feedback={{ text: 'Recurso insuficiente.', error: true }}/ >);
  assert.match(html, /role="alert"[^>]*>Recurso insuficiente\./);
});

test("exibe ficha da montaria com Cota de talas, Dados de Vida e salvaguardas contra a morte ao cair a 0 PV", () => {
  const alive = createAppState();
  const aliveHtml = renderToStaticMarkup(
    <Combat
      state={alive}
      sheet={getSheet(alive)}
      act={() => true}
      open={() => {}}
    />,
  );
  for (const text of [
    "Pesadelo Sanguinário",
    "Cavalo de Guerra",
    "Cota de talas",
    "Cascos",
    "Investida Atropeladora",
    "Dados de Vida",
  ]) {
    assert.ok(aliveHtml.includes(text), `Ausente em Combate: ${text}`);
  }
  assert.doesNotMatch(aliveHtml, /Salvaguardas contra a morte/);

  const fallen = applyAction(alive, { type: "hp", mode: "damage", amount: 64 });
  const fallenHtml = renderToStaticMarkup(
    <Combat
      state={fallen}
      sheet={getSheet(fallen)}
      act={() => true}
      open={() => {}}
    />,
  );
  assert.match(fallenHtml, /Salvaguardas contra a morte/);
  assert.match(fallenHtml, /Sucesso \(10–19\)/);
  assert.match(fallenHtml, /20 natural \(\+1 PV\)/);
});
