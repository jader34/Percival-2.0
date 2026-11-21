import test from 'node:test';
import assert from 'node:assert/strict';

// Importação dinâmica: o primeiro RED acusa a API ausente, não erro de sintaxe.
let api;
try { api = await import('../src/session/state.ts'); } catch (error) {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
}
const initial = () => api.createAppState();

test('ações malformadas e quantidades ausentes são rejeitadas em português sem gastar', () => {
  const state = frozen(initial());
  for (const action of [null, undefined, [], 'hp', 5, {}, {type: 'lay-on-hands', self: false}]) {
    assert.throws(() => api.applyAction(state, action), /inválid|inteiro/);
  }
  for (const amount of [undefined, null, '1', -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => act(state, 'lay-on-hands', { amount, self: false }), /inteiro/);
    assert.throws(() => act(state, 'potion', { healing: amount }), /inteiro/);
    assert.throws(() => act(state, 'item-quantity', { id: 'rations', quantity: amount }), /inteiro/);
  }
  assert.deepEqual(state, initial());
});

const corruptions = [
  ['versão', s => { s.version = 2; }],
  ['campo ausente', s => { delete s.session; }],
  ['campo desconhecido', s => { s.surprise = true; }],
  ['PV acima máximo', s => { s.session.hp = 65; }],
  ['PV negativo', s => { s.session.hp = -1; }],
  ['PV fracionário', s => { s.session.hp = 2.5; }],
  ['PV string', s => { s.session.hp = '64'; }],
  ['temporário inseguro', s => { s.session.tempHp = Number.MAX_SAFE_INTEGER + 1; }],
  ['slots tamanho errado', s => { s.session.slotsSpent.pop(); }],
  ['slot inexistente', s => { s.session.slotsSpent[4] = 1; }],
  ['slot excedido', s => { s.session.slotsSpent[0] = 5; }],
  ['recurso negativo', s => { s.session.resourceSpent.divineSense = -1; }],
  ['recurso excedido', s => { s.session.resourceSpent.layOnHands = 31; }],
  ['recurso ausente', s => { delete s.session.resourceSpent.bloodVeil; }],
  ['amuleto excedido', s => { s.session.resourceSpent.amuletChannelDivinity = 2; }],
  ['véu ativo sem uso gasto', s => { s.session.effects.bloodVeil = true; }],
  ['efeito sem booleano', s => { s.session.effects.bloodVeil = 1; }],
  ['efeito inconsciente', s => { s.session.hp = 0; s.session.effects.bloodBlessing = true; }],
  ['efeito sem manto', s => { s.record.equipment.find(i => i.id === 'blood-veil-cloak').quantity = 0; s.session.effects.bloodVeil = true; }],
  ['concentração inválida', s => { s.session.concentration = []; }],
  ['concentração desconhecida', s => { s.session.concentration = 'fireball'; }],
  ['concentração inconsciente', s => { s.session.hp = 0; s.session.concentration = 'bless'; }],
  ['notas objeto', s => { s.session.notes = {}; }],
  ['log inválido', s => { s.log = [5]; }],
  ['histórico não array', s => { s.history = {}; }],
  ['histórico excessivo', s => { s.history = Array.from({length: 21}, () => ({record: s.record, session: s.session})); }],
  ['histórico malformado', s => { s.history = [{ record: s.record, session: { hp: -1 } }]; }],
  ['record de outro personagem', s => { s.record.id = 'other'; }],
  ['record incompleto', s => { delete s.record.oath; }],
  ['modo de progressão', s => { s.record.progressionMode = 'automatic'; }],
  ['nome não string', s => { s.record.name = {}; }],
  ['peso negativo', s => { s.record.equipment[0].weightKg = -1; }],
  ['quantidade inválida', s => { s.record.equipment[0].quantity = -1; }],
  ['item desconhecido no esquema', s => { s.record.equipment[0].code = 'execute()'; }],
  ['moedas negativas', s => { s.record.coins.gp = -1; }],
  ['magia não catalogada', s => { s.record.preparedSpellIds.push('fireball'); }],
  ['concessão inválida', s => { s.record.additionalSpellAccess['warding-bond'] = 'true'; }],
  ['concessão arbitrária', s => { s.record.additionalSpellAccess.fireball = true; }],
  ['criação inválida', s => { s.record.creation.feat = 'other'; }],
  ['perícia falsy inválida', s => { s.record.creation.extraHumanSkill = false; }],
  ['bônus raciais inválidos', s => { s.record.creation.racialAbilityBonuses = ['str', 'str']; }],
  ['homebrew não textual', s => { s.record.oath.homebrewText.bloodBlessing = {}; }],
  ['evolução inválida', s => { s.record.advancements.push({level: 7, hitDieResult: 0}); }],
  ['snapshot histórico adulterado', s => { const r = structuredClone(s.record); r.baseline.hpMax = 999; s.history = [{record: r, session: s.session}]; }],
  ['Dados de Vida excedidos', s => { s.session.hitDiceSpent = 7; }],
  ['salvaguarda de morte com PV positivo', s => { s.session.deathSaves.failures = 1; }],
  ['estável com falhas pendentes', s => { s.session.hp = 0; s.session.deathSaves = { successes: 0, failures: 1, stable: true }; }],
  ['PV da montaria acima do máximo', s => { s.session.mount.hp = 20; }],
  ['Dados de Vida da montaria excedidos', s => { s.session.mount.hitDiceSpent = 4; }],
];
for (const [name, corrupt] of corruptions) {
  test(`rejeita backup e estado inconsistente: ${name}`, () => {
    const state = initial();
    corrupt(state);
    assert.throws(() => api.parseBackup(JSON.stringify(state)), /inválid|inteiro|Percival|precisa|incoerente|desconhecida|exced|Magia|d10/i);
    assert.throws(() => api.serialize(state));
    assert.throws(() => act(state, 'notes', { value: 'não reparar silenciosamente' }));
    assert.throws(() => api.undo(state));
  });
}
test('backup rejeita JSON ilegível, envelopes e poluição de protótipo', () => {
  for (const text of ['{', 'null', '[]', '1', '"texto"', '{}', '{"__proto__":{"polluted":true}}']) {
    assert.throws(() => api.parseBackup(text), /inválid|versão/i);
  }
  assert.throws(() => api.parseBackup(null), /texto/);
  assert.equal({}.polluted, undefined);
});

test('JSON preserva sessão, histórico validado e log; strings continuam apenas texto', () => {
  let state = act(initial(), 'notes', { value: 'globalThis.pwned = true; <script>alert(1)</script>' });
  state = act(state, 'cast', { spellId: 'bless', slotLevel: 1, concentration: true });
  state = act(state, 'hp', { mode: 'damage', amount: 1 });
  assert.equal(state.session.concentration, 'bless');
  const serialized = api.serialize(frozen(state));
  assert.equal(typeof serialized, 'string');
  const imported = api.parseBackup(serialized);
  assert.deepEqual(imported, state);
  assert.deepEqual(api.undo(imported), api.undo(state));
  imported.session.notes = 'alterada';
  assert.notEqual(imported.session.notes, state.session.notes);
  assert.equal(globalThis.pwned, undefined);
});

test('poção consome uma unidade e aplica cura física atomicamente, com log recente primeiro', () => {
  let state = act(initial(), 'hp', { mode: 'damage', amount: 30 });
  const before = frozen(state);
  state = act(state, 'potion', { healing: 15 });
  assert.equal(state.session.hp, 49);
  assert.equal(state.record.equipment.find(item => item.id === 'greater-healing-potion').quantity, 1);
  assert.match(state.log[0], /[Pp]oção/);
  assert.equal(state.log[1], before.log[0]);
  const undone = api.undo(state);
  assert.deepEqual(undone.record, before.record);
  assert.deepEqual(undone.session, before.session);
  assert.match(undone.log[0], /desfeita/);
  assert.throws(() => act(state, 'potion', { healing: -1 }), /inteiro/);
  state = act(state, 'potion', { healing: 20 });
  assert.equal(state.session.hp, 64);
  const exhausted = structuredClone(state);
  assert.throws(() => act(state, 'potion', { healing: 10 }), /[Pp]oção/);
  assert.deepEqual(state, exhausted);
});

test('preparação e concessão validam cota e nunca removem magias do juramento', () => {
  let state = initial();
  assert.throws(() => act(state, 'prepare', { spellId: 'bane' }), /juramento/);
  assert.throws(() => act(state, 'prepare', { spellId: 'fireball' }), /disponível/);
  assert.throws(() => act(state, 'prepare', { spellId: 'revivify' }), /disponível/);
  assert.throws(() => act(state, 'grant-spell', { id: 'fireball', allowed: true }), /inválid/);
  assert.throws(() => act(state, 'grant-spell', { id: 'warding-bond', allowed: 'sim' }), /boolean/);
  state = act(state, 'grant-spell', { id: 'warding-bond', allowed: true });
  assert.equal(api.getSheet(state).spellcasting.preparedCount, 7);
  assert.throws(() => act(state, 'prepare', { spellId: 'aid' }), /Limite/);
  state = act(state, 'prepare', { spellId: 'command' });
  state = act(state, 'prepare', { spellId: 'aid' });
  assert.equal(api.getSheet(state).spellcasting.preparedCount, 7);
  assert.throws(() => act(state, 'grant-spell', { id: 'warding-bond', allowed: false }), /permanente/);
  state = act(state, 'prepare', { spellId: 'warding-bond' });
  assert.equal(api.getSheet(state).spellcasting.preparedCount, 6);
  assert.throws(() => act(state, 'cast', { spellId: 'warding-bond', slotLevel: 2, concentration: false }), /preparada/);
  state = act(state, 'prepare', { spellId: 'warding-bond' });
  assert.equal(api.getSheet(state).spellcasting.preparedCount, 7);
});

test('evolução usa d10 físico e escolha do motor sem curar ou restaurar gastos', () => {
  let state = act(initial(), 'human-skill', { skill: 'perception' });
  assert.equal(api.getSheet(state).skills.perception.proficient, true);
  assert.throws(() => act(state, 'human-skill', { skill: 'athletics' }), /perícia|Perícia/);
  assert.throws(() => act(state, 'human-skill', { skill: 'not-a-skill' }), /perícia|Perícia/);
  assert.throws(() => act(state, 'human-skill', { skill: null }), /perícia|Perícia/);
  state = act(state, 'hp', { mode: 'damage', amount: 10 });
  state = act(state, 'smite', { slotLevel: 2 });
  state = act(state, 'lay-on-hands', { amount: 10, self: false });
  const session = structuredClone(state.session);
  state = act(state, 'level-up', { hitDieResult: 6 });
  assert.equal(api.getSheet(state).level, 7);
  assert.equal(api.getSheet(state).hpMax, 72);
  assert.deepEqual(state.session, session);
  assert.throws(() => act(state, 'level-up', { hitDieResult: 5 }), /escolha/);
  assert.throws(() => act(state, 'level-up', { hitDieResult: 0 }), /d10/);
  state = act(state, 'level-up', { hitDieResult: 5, improvement: { kind: 'ability', increases: { con: 2 } } });
  assert.equal(api.getSheet(state).hpMax, 87);
  assert.deepEqual(state.session, session);
  assert.equal(api.getSheet(api.undo(state)).level, 7);
  assert.equal(state.record.xp, 18967);
});

test('inventário e notas são reversíveis; sintonização permanente não recarrega itens', () => {
  let state = act(initial(), 'notes', { value: '<script>não executar()</script>' });
  assert.equal(state.session.notes, '<script>não executar()</script>');
  assert.throws(() => act(state, 'notes', { value: 5 }), /texto/);
  state = act(state, 'attunement', { value: true });
  assert.equal(api.getSheet(state).spellcasting.itemBonus, 1);
  state = act(state, 'use-resource', { resource: 'amuletChannelDivinity' });
  assert.throws(() => act(state, 'attunement', { value: false }), /permanente/);
  state = act(state, 'attunement', { value: true });
  assert.throws(() => act(state, 'use-resource', { resource: 'amuletChannelDivinity' }), /insuficiente/);
  state = act(state, 'equipment', { id: 'plate', equipped: false });
  assert.equal(api.getSheet(state).armorClass, 10);
  assert.equal(api.getSheet(api.undo(state)).armorClass, 18);
  state = act(state, 'blessing', { source: 'class' });
  state = act(state, 'item-quantity', { id: 'halberd', quantity: 0 });
  assert.equal(state.session.effects.bloodBlessing, false);
  state = act(state, 'item-quantity', { id: 'halberd', quantity: 1 });
  assert.equal(api.getSheet(state).homebrew.bloodBlessing.active, false);
  state = act(state, 'veil');
  state = act(state, 'equipment', { id: 'blood-veil-cloak', equipped: false });
  assert.equal(state.session.effects.bloodVeil, false);
  state = act(state, 'equipment', { id: 'blood-veil-cloak', equipped: true });
  assert.throws(() => act(state, 'veil'), /insuficiente/);
  for (const type of ['equipment', 'item-quantity']) assert.throws(() => act(state, type, { id: 'invalid', quantity: 1, equipped: true }), /encontrado/);
  assert.throws(() => act(state, 'equipment', { id: 'plate', equipped: 'sim' }), /boolean/);
  assert.throws(() => act(state, 'attunement', { value: null }), /boolean/);
  assert.throws(() => act(state, 'item-quantity', { id: 'rations', quantity: -1 }), /inteiro/);
});

test('descanso curto, longo e amanhecer recuperam somente seus recursos', () => {
  let state = initial();
  state.record.equipment.find(item => item.id === 'amulet-of-the-devout').attuned = true;
  state = act(state, 'blessing', { source: 'amulet' });
  state = act(state, 'use-resource', { resource: 'channelDivinity' });
  state = act(state, 'use-resource', { resource: 'divineSense' });
  state = act(state, 'lay-on-hands', { amount: 3, self: false });
  state = act(state, 'veil');
  state = act(state, 'cast', { spellId: 'bless', slotLevel: 1, concentration: true });
  state = act(state, 'hp', { mode: 'damage', amount: 20 });
  state = act(state, 'hp', { mode: 'temp', amount: 5 });
  const before = frozen(state);
  const short = act(before, 'rest', { kind: 'short' });
  const expected = structuredClone(before.session);
  expected.resourceSpent.channelDivinity = 0;
  assert.deepEqual(short.session, expected);
  const dawn = act(before, 'rest', { kind: 'dawn' });
  const expectedDawn = structuredClone(before.session);
  expectedDawn.resourceSpent.amuletChannelDivinity = 0;
  assert.deepEqual(dawn.session, expectedDawn);
  const long = act(before, 'rest', { kind: 'long' });
  assert.equal(long.session.hp, 64);
  assert.equal(long.session.tempHp, 0);
  assert.deepEqual(long.session.slotsSpent, [0, 0, 0, 0, 0]);
  assert.deepEqual(long.session.resourceSpent, { layOnHands: 0, divineSense: 0, channelDivinity: 0, amuletChannelDivinity: 1, bloodVeil: 0 });
  assert.deepEqual(long.session.effects, { bloodBlessing: false, bloodVeil: false });
  assert.equal(long.session.concentration, null);
  assert.throws(() => act(before, 'rest', { kind: 'invalid' }), /inválid/);
});

test('conjuração e destruição compartilham espaços; concentração substitui sem rolar dados', () => {
  let state = initial();
  assert.throws(() => act(state, 'cast', { spellId: 'prayer-of-healing', slotLevel: 2, concentration: false }), /preparada/);
  assert.throws(() => act(state, 'cast', { spellId: 'lesser-restoration', slotLevel: 1, concentration: false }), /círculo/);
  assert.throws(() => act(state, 'cast', { spellId: 'aid', slotLevel: 2, concentration: false }), /preparada/);
  assert.throws(() => act(state, 'cast', { spellId: 'bless', slotLevel: 1, concentration: 'true' }), /boolean/);
  state = act(frozen(state), 'cast', { spellId: 'bless', slotLevel: 1, concentration: true });
  assert.equal(state.session.concentration, 'bless');
  state = act(state, 'cast', { spellId: 'hunters-mark', slotLevel: 1, concentration: true });
  assert.equal(state.session.concentration, 'hunters-mark');
  state = act(state, 'cast', { spellId: 'cure-wounds', slotLevel: 1, concentration: false });
  assert.equal(state.session.concentration, 'hunters-mark');
  state = act(state, 'smite', { slotLevel: 1 });
  assert.deepEqual(state.session.slotsSpent, [4, 0, 0, 0, 0]);
  assert.throws(() => act(state, 'smite', { slotLevel: 1 }), /insuficiente/);
  assert.throws(() => act(state, 'cast', { spellId: 'bless', slotLevel: 1, concentration: true }), /insuficiente/);
  for (const slotLevel of [0, 6, -1, 1.5, '1']) assert.throws(() => act(state, 'smite', { slotLevel }), /inteiro|círculo/);
  assert.throws(() => act(state, 'smite', { slotLevel: 3 }), /insuficiente/);
  state = act(state, 'end-concentration');
  assert.equal(state.session.concentration, null);
  state = act(state, 'cast', { spellId: 'bless', slotLevel: 2, concentration: true });
  state = act(state, 'hp', { mode: 'damage', amount: 64 });
  assert.equal(state.session.concentration, null);
});

test('recursos e efeitos compartilham usos, exigem equipamento e encerram bênção ao cair', () => {
  let state = act(initial(), 'hp', { mode: 'damage', amount: 20 });
  state = act(state, 'lay-on-hands', { amount: 5, self: false });
  assert.equal(state.session.hp, 44);
  state = act(state, 'lay-on-hands', { amount: 25, self: true });
  assert.equal(state.session.hp, 64);
  assert.equal(state.session.resourceSpent.layOnHands, 30);
  assert.throws(() => act(state, 'lay-on-hands', { amount: 1, self: true }), /insuficiente/);
  assert.throws(() => act(state, 'lay-on-hands', { amount: 0, self: 'sim' }), /boolean/);
  for (let i = 0; i < 5; i++) state = act(state, 'use-resource', { resource: 'divineSense' });
  assert.throws(() => act(state, 'use-resource', { resource: 'divineSense' }), /insuficiente/);
  assert.throws(() => act(state, 'use-resource', { resource: 'toString' }), /inválid/);
  const withoutAmulet = act(state, 'equipment', { id: 'amulet-of-the-devout', equipped: false });
  assert.throws(() => act(withoutAmulet, 'blessing', { source: 'amulet' }), /insuficiente/);
  assert.throws(() => act(state, 'blessing', { source: 'oops' }), /inválid/);
  state = act(state, 'blessing', { source: 'class' });
  assert.equal(state.session.resourceSpent.channelDivinity, 1);
  assert.equal(api.getSheet(state).attacks.halberd.toHit, 10);
  assert.throws(() => act(state, 'blessing', { source: 'class' }), /ativa/);
  assert.throws(() => act(state, 'use-resource', { resource: 'channelDivinity' }), /insuficiente/);
  state = act(state, 'veil');
  assert.equal(api.getSheet(state).armorClass, 20);
  assert.equal(state.session.resourceSpent.bloodVeil, 1);
  assert.throws(() => act(state, 'veil'), /ativo/);
  state = act(state, 'hp', { mode: 'damage', amount: 64 });
  assert.equal(state.session.effects.bloodBlessing, false);
  assert.equal(api.getSheet(state).auras.protection.active, false);
  state = act(state, 'hp', { mode: 'heal', amount: 1 });
  assert.equal(api.getSheet(state).homebrew.bloodBlessing.active, false);
  state = act(state, 'end-effect', { effect: 'bloodVeil' });
  assert.equal(api.getSheet(state).armorClass, 18);
  assert.throws(() => act(state, 'veil'), /insuficiente/);
  assert.throws(() => act(state, 'end-effect', { effect: 'invalid' }), /inválid/);
  const noWeapon = initial();
  noWeapon.record.equipment.find(item => item.id === 'halberd').equipped = false;
  assert.throws(() => act(noWeapon, 'blessing', { source: 'class' }), /arma/);
  const noCloak = initial();
  noCloak.record.equipment.find(item => item.id === 'blood-veil-cloak').equipped = false;
  assert.throws(() => act(noCloak, 'veil'), /insuficiente/);
});

test('PV respeita dano temporário, cura limitada, pureza e desfazer limitado', () => {
  const original = frozen(initial());
  let state = act(original, 'hp', { mode: 'temp', amount: 10 });
  state = act(state, 'hp', { mode: 'temp', amount: 3 });
  assert.equal(state.session.tempHp, 10);
  state = act(state, 'hp', { mode: 'damage', amount: 14 });
  assert.equal(state.session.hp, 60);
  assert.equal(state.session.tempHp, 0);
  const damaged = frozen(state);
  state = act(state, 'hp', { mode: 'heal', amount: Number.MAX_SAFE_INTEGER });
  assert.equal(state.session.hp, 64);
  assert.equal(api.undo(state).session.hp, 60);
  assert.equal(damaged.session.hp, 60);
  assert.equal(original.history.length, 0);
  for (let i = 0; i < 25; i++) state = act(state, 'hp', { mode: 'damage', amount: 1 });
  assert.equal(state.history.length, 20);
  for (let i = 0; i < 20; i++) state = api.undo(state);
  assert.equal(state.session.hp, 59);
  assert.deepEqual(api.undo(initial()), initial());
  for (const amount of [-1, 1.1, NaN, Infinity, '2', Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => act(original, 'hp', { mode: 'damage', amount }), /inteiro/);
  }
  assert.throws(() => act(original, 'hp', { mode: 'oops', amount: 1 }), /inválid/);
  assert.throws(() => act(original, 'desconhecida'), /inválid/);
  assert.equal(act(original, 'hp', { mode: 'damage', amount: 100 }).session.hp, 0);
});
const act = (state, type, fields = {}) => api.applyAction(state, { type, ...fields });
const frozen = (value) => { Object.freeze(value); for (const child of Object.values(value)) if (child && typeof child === 'object') frozen(child); return value; };

test('inicia sessão independente com PV64 e recursos não gastos', () => {
  assert.ok(api, 'A API de estado de sessão deve existir');
  const state = initial();
  assert.equal(state.version, 1);
  assert.equal(state.session.hp, 64);
  assert.equal(state.session.tempHp, 0);
  assert.deepEqual(state.session.slotsSpent, [0, 0, 0, 0, 0]);
  assert.deepEqual(Object.values(state.session.resourceSpent), [0, 0, 0, 0, 0]);
  assert.deepEqual(state.history, []);
  assert.equal(api.getSheet(frozen(state)).hpMax, 64);
  const other = initial();
  other.record.name = 'Outro';
  assert.notEqual(other.record.name, state.record.name);
});

test('Dados de Vida de Percival e da montaria somam Constituição e recuperam até metade no descanso longo', () => {
  let state = act(initial(), 'hp', { mode: 'damage', amount: 30 });
  state = act(state, 'mount-hp', { mode: 'damage', amount: 12 });
  assert.equal(state.session.hp, 34);
  assert.equal(state.session.mount.hp, 7);
  assert.throws(() => act(state, 'hit-dice', { count: 0, rollTotal: 5 }), /inteiro/);
  assert.throws(() => act(state, 'hit-dice', { count: 2, rollTotal: 1 }), /inteiro/);
  assert.throws(() => act(state, 'hit-dice', { count: 1, rollTotal: 11 }), /inteiro/);
  state = act(state, 'hit-dice', { count: 2, rollTotal: 11 }); // 11 + 2*2 CON = +15 PV -> 49
  assert.equal(state.session.hp, 49);
  assert.equal(state.session.hitDiceSpent, 2);
  state = act(state, 'hit-dice', { count: 3, rollTotal: 12 }); // 12 + 3*2 CON = +18 -> cap 64
  assert.equal(state.session.hp, 64);
  assert.equal(state.session.hitDiceSpent, 5);
  state = act(state, 'mount-hit-dice', { count: 2, rollTotal: 9 }); // 9 + 2*1 CON = +11 -> 18
  assert.equal(state.session.mount.hp, 18);
  assert.equal(state.session.mount.hitDiceSpent, 2);
  const rested = act(state, 'rest', { kind: 'long' });
  assert.equal(rested.session.hitDiceSpent, 2, 'Recupera 3 de 6 d10 no descanso longo.');
  assert.equal(rested.session.mount.hitDiceSpent, 1, 'Montaria recupera 1 de 3 d10 no descanso longo.');
  assert.equal(rested.session.mount.hp, 19);
});

test('salvaguardas contra a morte respeitam 0 PV, 1/20 naturais, estabilização, dano em 0 PV e cura', () => {
  let state = initial();
  assert.throws(() => act(state, 'death-save', { outcome: 'success' }), /0 PV/);
  state = act(state, 'hp', { mode: 'damage', amount: 64 });
  assert.equal(state.session.hp, 0);
  state = act(state, 'death-save', { outcome: 'success' });
  state = act(state, 'death-save', { outcome: 'success' });
  assert.deepEqual(state.session.deathSaves, { successes: 2, failures: 0, stable: false });
  state = act(state, 'death-save', { outcome: 'success' });
  assert.deepEqual(state.session.deathSaves, { successes: 0, failures: 0, stable: true });
  assert.throws(() => act(state, 'death-save', { outcome: 'success' }), /estável/);
  // Dano crítico em 0 PV quebra estabilidade e aplica 2 falhas
  state = act(state, 'hp', { mode: 'damage', amount: 4, critical: true });
  assert.deepEqual(state.session.deathSaves, { successes: 0, failures: 2, stable: false });
  // 20 natural levanta com 1 PV e limpa salvaguardas
  const revived = act(state, 'death-save', { outcome: 'nat20' });
  assert.equal(revived.session.hp, 1);
  assert.deepEqual(revived.session.deathSaves, { successes: 0, failures: 0, stable: false });
  assert.equal(api.getSheet(revived).auras.protection.active, true);
  // 1 natural soma 2 falhas e encerra aos 3
  const fallen = act(state, 'death-save', { outcome: 'nat1' });
  assert.equal(fallen.session.deathSaves.failures, 3);
  assert.throws(() => act(fallen, 'death-save', { outcome: 'failure' }), /3 falhas/);
  const healed = act(fallen, 'hp', { mode: 'heal', amount: 5 });
  assert.equal(healed.session.hp, 5);
  assert.deepEqual(healed.session.deathSaves, { successes: 0, failures: 0, stable: false });
});

test('montaria controla PV temporários, barda de Cota de talas e reconvocação', () => {
  let state = act(initial(), 'mount-hp', { mode: 'temp', amount: 5 });
  state = act(state, 'mount-hp', { mode: 'damage', amount: 24 });
  assert.equal(state.session.mount.tempHp, 0);
  assert.equal(state.session.mount.hp, 0);
  state = act(state, 'mount-armor', { equipped: false });
  assert.equal(api.getSheet(state).mount.armorClass, 11);
  state = act(state, 'mount-summon');
  assert.equal(state.session.mount.hp, 19);
});

test('soma XP ganho automaticamente a partir de 18.967 sem subir de nível sozinho e permite desfazer', () => {
  let state = initial();
  assert.equal(state.record.xp, 18967);
  assert.throws(() => act(state, 'xp', { mode: 'add', amount: 0 }), /inteiro/);
  assert.throws(() => act(state, 'xp', { mode: 'add', amount: -50 }), /inteiro/);
  assert.throws(() => act(state, 'xp', { mode: 'set', amount: -1 }), /inteiro/);
  state = act(state, 'xp', { mode: 'add', amount: 1250 });
  assert.equal(state.record.xp, 20217);
  state = act(state, 'xp', { mode: 'add', amount: 3000 });
  assert.equal(state.record.xp, 23217);
  assert.equal(api.getSheet(state).level, 6, 'Alcançar 23.000 XP não inventa o d10 físico do nível 7.');
  assert.equal(api.undo(state).record.xp, 20217);
  state = act(state, 'xp', { mode: 'set', amount: 18967 });
  assert.equal(state.record.xp, 18967);
});
