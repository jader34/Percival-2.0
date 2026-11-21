import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const load = async (path) => {
  try { return await import(path); }
  catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND' && error.url === new URL(path, import.meta.url).href) return {};
    throw error;
  }
};
const rules = await load('../src/percival/rules.ts');
const data = await load('../src/percival/data.ts');

test('confirma permanentemente amuleto e acesso sem preparar ou ativar as três magias', () => {
  assert.equal(data.PERCIVAL.equipment.find(i => i.id === 'amulet-of-the-devout').attuned, true);
  for (const id of ['warding-bond', 'prayer-of-healing', 'gentle-repose']) {
    assert.equal(data.PERCIVAL.additionalSpellAccess[id], true);
    assert.ok(rules.calculatePercival(data.PERCIVAL).spellcasting.availableSpells.some(s => s.id === id));
  }
  assert.ok(!data.PERCIVAL.preparedSpellIds.includes('prayer-of-healing'));
  assert.ok(!data.PERCIVAL.preparedSpellIds.includes('gentle-repose'));
});

test('calcula a ficha do nível 6 sem somar novamente o aumento de Carisma do nível 4', () => {
  assert.equal(typeof rules.calculatePercival, 'function', 'O motor da ficha ainda não existe.');
  const sheet = rules.calculatePercival(data.PERCIVAL);
  assert.equal(sheet.name, 'Percival "O Triturador"');
  assert.equal(sheet.level, 6);
  assert.deepEqual(sheet.abilities, { str: 16, dex: 10, con: 14, int: 13, wis: 12, cha: 18 });
  assert.deepEqual(sheet.modifiers, { str: 3, dex: 0, con: 2, int: 1, wis: 1, cha: 4 });
  assert.equal(sheet.proficiencyBonus, 3);
  assert.equal(sheet.hpMax, 64);
  assert.equal(sheet.armorClass, 18);
  assert.equal(sheet.initiative, 0);
  assert.equal(sheet.passivePerception, 14);
  assert.equal(sheet.attacks.halberd.toHit, 6);
  assert.equal(sheet.attacks.halberd.damage, '1d10 + 3');
  assert.equal(sheet.attacks.polearmButt.damage, '1d4 + 3');
  assert.equal(sheet.attacks.perAttackAction, 2);
  assert.deepEqual(sheet.savingThrowsWithoutAura, { str: 3, dex: 0, con: 2, int: 1, wis: 4, cha: 7 });
  assert.deepEqual(sheet.savingThrows, { str: 7, dex: 4, con: 6, int: 5, wis: 8, cha: 11 });
  assert.equal(sheet.skills.athletics.bonus, 6);
  assert.equal(sheet.skills.insight.bonus, 4);
  assert.equal(sheet.skills.intimidation.bonus, 7);
  assert.equal(sheet.skills.persuasion.bonus, 7);
  assert.equal(Object.keys(sheet.skills).length, 18);
  assert.equal(sheet.resources.layOnHands.maximum, 30);
  assert.equal(sheet.resources.divineSense.maximum, 5);
  assert.equal(sheet.resources.channelDivinity.maximum, 1);
  assert.equal(sheet.mount.name, 'Pesadelo Sanguinário');
  assert.equal(sheet.mount.species, 'Cavalo de Guerra');
  assert.equal(sheet.mount.hpMax, 19);
  assert.equal(sheet.mount.armorClass, 17);
  assert.equal(sheet.mount.speedMeters, 18);
  assert.equal(sheet.mount.initiative, 1);
  assert.equal(sheet.mount.passivePerception, 11);
  assert.equal(sheet.mount.stealthDisadvantage, true);
  assert.equal(sheet.mount.hitDice.maximum, 3);
  assert.equal(sheet.mount.hitDice.conModifier, 1);
  assert.equal(sheet.mount.hitDice.longRestRecovery, 1);
  assert.equal(sheet.mount.attack.toHit, 6);
  assert.equal(sheet.mount.attack.damage, '2d6 + 4');
  assert.deepEqual(sheet.mount.savingThrowsWithoutAura, { str: 4, dex: 1, con: 1, int: -4, wis: 1, cha: -2 });
  assert.deepEqual(sheet.mount.savingThrowsWithAura, { str: 8, dex: 5, con: 5, int: 0, wis: 5, cha: 2 });
});

test('evolui somente com d10 físico informado e aplica Constituição retroativa sem alterar a entrada', () => {
  assert.equal(typeof rules.levelUp, 'function', 'Ainda falta registrar uma evolução física.');
  const original = structuredClone(data.PERCIVAL);
  const level7 = rules.levelUp(data.PERCIVAL, { hitDieResult: 7 });
  assert.equal(rules.calculatePercival(level7).level, 7);
  assert.equal(rules.calculatePercival(level7).hpMax, 73);
  assert.deepEqual(level7.advancements, [{ level: 7, hitDieResult: 7 }]);
  const level8 = rules.levelUp(level7, { hitDieResult: 7, improvement: { kind: 'ability', increases: { con: 2 } } });
  const sheet8 = rules.calculatePercival(level8);
  assert.equal(sheet8.level, 8);
  assert.equal(sheet8.abilities.con, 16);
  assert.equal(sheet8.hpMax, 90);
  assert.equal(sheet8.resources.layOnHands.maximum, 40);
  assert.deepEqual(data.PERCIVAL, original);
  assert.equal(level7.advancements.length, 1);
  for (const hitDieResult of [undefined, null, true, '7', 0, 11, 3.5, NaN, Infinity]) {
    assert.throws(() => rules.levelUp(data.PERCIVAL, { hitDieResult }), /d10/i);
  }
  assert.throws(() => rules.levelUp(level7, { hitDieResult: 7 }), /escolha.*nível 8/i);
  assert.throws(() => rules.levelUp(data.PERCIVAL, { hitDieResult: 7, improvement: { kind: 'ability', increases: { cha: 2 } } }), /incremento.*nível 7/i);
  for (const increases of [{ cha: 3 }, { cha: 1 }, { cha: 2, con: 1 }, { nope: 2 }, { cha: 1.5, con: 0.5 }, { cha: -1, con: 3 }]) {
    assert.throws(() => rules.levelUp(level7, { hitDieResult: 7, improvement: { kind: 'ability', increases } }), /incremento/i);
  }
  const atCap = structuredClone(level7);
  atCap.baseline.abilities.cha = 20;
  assert.throws(() => rules.levelUp(atCap, { hitDieResult: 7, improvement: { kind: 'ability', increases: { cha: 2 } } }), /20/);
  const withMoreXp = { ...data.PERCIVAL, xp: 355000 };
  assert.equal(rules.calculatePercival(withMoreXp).level, 6, 'XP não inventa escolhas ou rolagens.');
});

const advanceTo = (target) => {
  let record = structuredClone(data.PERCIVAL);
  for (let level = 7; level <= target; level++) {
    record = rules.levelUp(record, {
      hitDieResult: 7,
      ...([8, 12, 16, 19].includes(level) ? { improvement: { kind: 'ability', increases: { int: 1, wis: 1 } } } : {}),
    });
  }
  return record;
};

test('deriva espaços e magias de juramento até o nível 20 sem consumir a cota de preparação', () => {
  const sheet6 = rules.calculatePercival(data.PERCIVAL);
  assert.ok(sheet6.spellcasting, 'Faltam os cálculos de conjuração.');
  assert.equal(sheet6.spellcasting.saveDC, 16);
  assert.equal(sheet6.spellcasting.attackBonus, 8);
  assert.equal(sheet6.spellcasting.preparedLimit, 7);
  assert.equal(sheet6.spellcasting.preparedCount, 7);
  assert.deepEqual(sheet6.spellcasting.unresolvedPreparedSpellIds, []);
  assert.deepEqual(sheet6.spellcasting.oathSpells.map(s => s.id), ['bane', 'hunters-mark', 'hold-person', 'misty-step']);
  const slotsByLevel = [
    [4,2,0,0,0], [4,3,0,0,0], [4,3,0,0,0], [4,3,2,0,0], [4,3,2,0,0],
    [4,3,3,0,0], [4,3,3,0,0], [4,3,3,1,0], [4,3,3,1,0], [4,3,3,2,0],
    [4,3,3,2,0], [4,3,3,3,1], [4,3,3,3,1], [4,3,3,3,2], [4,3,3,3,2],
  ];
  slotsByLevel.forEach((slots, index) => {
    const sheet = rules.calculatePercival(advanceTo(index + 6));
    assert.deepEqual(sheet.spellcasting.slots, slots, `Espaços no nível ${index + 6}`);
    assert.equal(sheet.proficiencyBonus, 2 + Math.floor((index + 5) / 4));
  });
  const at9 = rules.calculatePercival(advanceTo(9));
  assert.ok(at9.spellcasting.oathSpells.some(s => s.id === 'haste'));
  assert.ok(at9.spellcasting.availableSpells.some(s => s.id === 'revivify'));
  assert.equal(rules.calculatePercival(advanceTo(13)).spellcasting.oathSpells.length, 8);
  assert.equal(rules.calculatePercival(advanceTo(17)).spellcasting.oathSpells.length, 10);
  const allowed = structuredClone(data.PERCIVAL);
  allowed.additionalSpellAccess['warding-bond'] = true;
  assert.equal(rules.calculatePercival(allowed).spellcasting.preparedCount, 7);
  assert.deepEqual(rules.calculatePercival(allowed).spellcasting.unresolvedPreparedSpellIds, []);
  const invalid = structuredClone(data.PERCIVAL);
  invalid.preparedSpellIds = ['revivify'];
  assert.throws(() => rules.calculatePercival(invalid), /espaço|nível/i);
  invalid.preparedSpellIds = ['unknown-spell'];
  assert.throws(() => rules.calculatePercival(invalid), /desconhecida/i);
  invalid.preparedSpellIds = ['bless', 'bless'];
  assert.throws(() => rules.calculatePercival(invalid), /repetida/i);
  invalid.preparedSpellIds = ['bless', 'command', 'cure-wounds', 'thunderous-smite', 'shield-of-faith', 'lesser-restoration', 'aid', 'heroism'];
  assert.throws(() => rules.calculatePercival(invalid), /limite/i);
});

test('distingue bônus de item, efeitos de sangue e Aura de Proteção sem criar usos separados de Canalizar', () => {
  const record = structuredClone(data.PERCIVAL);
  const amulet = record.equipment.find(item => item.id === 'amulet-of-the-devout');
  amulet.attuned = true;
  const active = rules.calculatePercival(record, { bloodBlessingActive: true, bloodVeilActive: true });
  assert.equal(active.spellcasting.saveDC, 16, 'Sintonização concede +1 na CD.');
  assert.equal(active.spellcasting.attackBonus, 8);
  assert.equal(active.attacks.halberd.toHit, 10);
  assert.equal(active.armorClass, 20);
  assert.equal(active.savingThrows.dex, 6);
  assert.equal(active.initiative, 0);
  assert.equal(active.resources.channelDivinity.maximum, 1);
  assert.equal(active.resources.amuletChannelDivinity.maximum, 1);
  assert.equal(active.resources.amuletChannelDivinity.recovery, 'dawn');
  assert.equal(active.resources.bloodVeil.recovery, 'long-rest');
  assert.equal(active.resources.bloodBlessing, undefined);
  assert.equal(active.homebrew.bloodBlessing.damageType, 'radiant');
  assert.equal(active.homebrew.bloodBlessing.markedTargetExtraDamage, 4);
  assert.equal(active.homebrew.absorbVitality.saveDC, 16);
  const unconscious = rules.calculatePercival(record, { conscious: false, bloodBlessingActive: true });
  assert.deepEqual(unconscious.savingThrows, unconscious.savingThrowsWithoutAura);
  assert.equal(unconscious.attacks.halberd.toHit, 6);
  assert.equal(unconscious.auras.protection.active, false);
  assert.equal(unconscious.homebrew.bloodBlessing.active, false);
  assert.equal(rules.calculatePercival(record).attacks.halberd.toHit, 6, 'Contexto anterior não vaza para o seguinte.');
  amulet.equipped = false;
  const withoutAmulet = rules.calculatePercival(record);
  assert.equal(withoutAmulet.spellcasting.saveDC, 15);
  assert.equal(withoutAmulet.resources.amuletChannelDivinity.maximum, 0);
  record.equipment.find(item => item.id === 'plate').equipped = false;
  assert.equal(rules.calculatePercival(record).armorClass, 10);
  record.creation.extraHumanSkill = 'perception';
  assert.equal(rules.calculatePercival(record).passivePerception, 14);
  record.mount.armor.equipped = false;
  const unarmoredMount = rules.calculatePercival(record);
  assert.equal(unarmoredMount.mount.armorClass, 11);
  assert.equal(unarmoredMount.mount.stealthDisadvantage, false);
});

test('desbloqueia características de classe sem conceder as habilidades não confirmadas de Vingança', () => {
  const at6 = rules.calculatePercival(data.PERCIVAL);
  assert.ok(Array.isArray(at6.features), 'Falta a progressão das características.');
  assert.ok(at6.features.some(f => f.id === 'aura-of-protection'));
  assert.ok(!at6.features.some(f => f.id === 'aura-of-courage'));
  assert.equal(at6.hitDice.maximum, 6);
  assert.equal(at6.hitDice.die, 'd10');
  assert.equal(at6.hitDice.longRestRecovery, 3);
  assert.equal(at6.attacks.improvedDivineSmite, null);
  assert.ok(rules.calculatePercival(advanceTo(7)).warnings.some(w => w.code === 'oath-feature-7'));
  const at10 = rules.calculatePercival(advanceTo(10));
  assert.ok(at10.features.some(f => f.id === 'aura-of-courage'));
  assert.equal(at10.auras.courage.active, true);
  assert.equal(rules.calculatePercival(advanceTo(10), { conscious: false }).auras.courage.active, false);
  assert.equal(rules.calculatePercival(advanceTo(11)).attacks.improvedDivineSmite, '1d8');
  assert.equal(rules.calculatePercival(advanceTo(14)).resources.cleansingTouch.maximum, 4);
  assert.equal(rules.calculatePercival(advanceTo(18)).auras.protection.radiusMeters, 9);
  assert.equal(rules.calculatePercival(advanceTo(18)).auras.courage.radiusMeters, 9);
  const at20 = rules.calculatePercival(advanceTo(20));
  assert.deepEqual(at20.warnings.filter(w => w.code.startsWith('oath-feature-')).map(w => w.code),
    ['oath-feature-7', 'oath-feature-15', 'oath-feature-20']);
  assert.ok(!at20.features.some(f => ['relentless-avenger', 'soul-of-vengeance', 'avenging-angel', 'vow-of-enmity'].includes(f.id)));
  assert.throws(() => rules.levelUp(advanceTo(20), { hitDieResult: 7 }), /máximo 20/i);
});

test('informa dados físicos de Destruição Divina respeitando círculo, teto, tipo de alvo e crítico', () => {
  assert.equal(typeof rules.divineSmite, 'function');
  assert.equal(rules.divineSmite(data.PERCIVAL, 1).expression, '2d8');
  assert.equal(rules.divineSmite(data.PERCIVAL, 2).expression, '3d8');
  assert.equal(rules.divineSmite(data.PERCIVAL, 2, { fiendOrUndead: true, critical: true }).expression, '8d8');
  assert.throws(() => rules.divineSmite(data.PERCIVAL, 3), /espaço/i);
  for (const slot of [0, 6, 1.5, '2', NaN]) assert.throws(() => rules.divineSmite(data.PERCIVAL, slot), /círculo/i);
  const record = advanceTo(20);
  assert.equal(rules.divineSmite(record, 5).expression, '5d8');
  assert.equal(rules.divineSmite(record, 5, { fiendOrUndead: true }).expression, '6d8');
  assert.equal(rules.divineSmite(record, 5, { fiendOrUndead: true, critical: true }).expression, '12d8');
  assert.equal(rules.divineSmite(record, 5).rollMode, 'physical-only');
});

test('expõe dados não confirmados e recusa talentos sem automação em vez de inventar efeitos', () => {
  const sheet = rules.calculatePercival(data.PERCIVAL);
  const warnings = sheet.warnings.map(w => w.code);
  assert.ok(!warnings.includes('human-skill'), 'Percepção já foi confirmada.');
  const unconfirmed = structuredClone(data.PERCIVAL);
  unconfirmed.creation.extraHumanSkill = null;
  assert.ok(rules.calculatePercival(unconfirmed).warnings.some(w => w.code === 'human-skill'));
  assert.ok(!warnings.includes('amulet-attunement'));
  assert.ok(!warnings.includes('extra-spell-warding-bond'));
  assert.equal(sheet.calculationStatus, 'needs-confirmation');
  assert.equal(sheet.xp.current, 18967);
  assert.equal(sheet.xp.nextLevelThreshold, 23000);
  assert.equal(sheet.nextLevel.level, 7);
  assert.equal(sheet.nextLevel.requiresPhysicalD10, true);
  assert.equal(sheet.nextLevel.requiresHomebrewDefinition, true);
  const at7 = advanceTo(7);
  assert.equal(rules.calculatePercival(at7).nextLevel.requiresImprovementChoice, true);
  const at8 = rules.levelUp(at7, { hitDieResult: 7, improvement: { kind: 'ability', increases: { cha: 2 } } });
  const sheet8 = rules.calculatePercival(at8, { bloodBlessingActive: true });
  assert.equal(sheet8.abilities.cha, 20);
  assert.equal(sheet8.spellcasting.preparedLimit, 9);
  assert.equal(sheet8.spellcasting.saveDC, 17);
  assert.equal(sheet8.resources.divineSense.maximum, 6);
  assert.equal(sheet8.homebrew.bloodBlessing.attackBonus, 5);
  assert.throws(() => rules.levelUp(at7, { hitDieResult: 7, improvement: {
    kind: 'feat', name: 'Robusto', source: 'PHB:172', description: 'PV por nível',
  } }), /talento.*automatiz/i);
  assert.equal(rules.calculatePercival(advanceTo(20)).nextLevel, null);
});

test('recusa registros inconsistentes e evita interpretar texto como um efeito ativo', () => {
  const cases = [
    record => { record.schemaVersion = 2; },
    record => { record.id = 'outro-personagem'; },
    record => { record.race = 'elf'; },
    record => { record.xp = -1; },
    record => { record.baseline.abilities.cha = 21; },
    record => { record.proficientSkills.push('pericia-inventada'); },
    record => { record.creation.extraHumanSkill = 'athletics'; },
    record => { record.equipment[0].quantity = -1; },
    record => { record.equipment[0].equipped = 'false'; },
    record => { record.equipment.push({ ...record.equipment[0] }); },
    record => { record.advancements = [{ level: 8, hitDieResult: 7 }]; },
    record => { record.advancements = [{ level: 7, hitDieResult: 7 }, { level: 7, hitDieResult: 7 }]; },
  ];
  for (const change of cases) {
    const record = structuredClone(data.PERCIVAL);
    change(record);
    assert.throws(() => rules.calculatePercival(record));
  }
  assert.throws(() => rules.calculatePercival(data.PERCIVAL, { conscious: 'false' }), /boolean/i);
  assert.throws(() => rules.divineSmite(data.PERCIVAL, 1, { critical: 'false' }), /boolean/i);
  const noStrength = structuredClone(data.PERCIVAL);
  noStrength.baseline.abilities.str = 12;
  assert.equal(rules.calculatePercival(noStrength).speedMeters, 6);
});

test('oferece uma consulta executável da ficha sem gravar dados nem rolar dados virtuais', () => {
  const script = new URL('../scripts/show-percival.mjs', import.meta.url);
  assert.ok(existsSync(script), 'Falta o comando de consulta da ficha.');
  const output = JSON.parse(execFileSync(process.execPath, [fileURLToPath(script)], { encoding: 'utf8' }));
  assert.deepEqual(output.record, data.PERCIVAL);
  assert.deepEqual(output.calculated, rules.calculatePercival(data.PERCIVAL));
  assert.equal(output.sources.book.sha256, data.SOURCES.book.sha256);
  for (const path of ['../src/percival/rules.ts', '../scripts/show-percival.mjs']) {
    assert.doesNotMatch(readFileSync(new URL(path, import.meta.url), 'utf8'), /Math\.random|randomInt|randomBytes/);
  }
});

test('resultados calculados não compartilham objetos mutáveis com as regras ou os dados de entrada', () => {
  const first = rules.calculatePercival(data.PERCIVAL);
  first.spellcasting.oathSpells[0].name = 'alterado';
  first.spellcasting.availableSpells[0].name = 'alterado';
  first.features[0].name = 'alterado';
  first.abilities.cha = 1;
  first.mount.abilities.str = 1;
  first.mount.traits[0].name = 'alterado';
  first.spellcasting.slots[0] = 999;
  const second = rules.calculatePercival(data.PERCIVAL);
  assert.equal(second.abilities.cha, 18);
  assert.equal(second.mount.abilities.str, 18);
  assert.notEqual(second.mount.traits[0].name, 'alterado');
  assert.equal(second.spellcasting.slots[0], 4);
  assert.notEqual(second.spellcasting.oathSpells[0].name, 'alterado');
  assert.notEqual(second.spellcasting.availableSpells[0].name, 'alterado');
  assert.notEqual(second.features[0].name, 'alterado');
  assert.equal(data.PERCIVAL.advancements.length, 0);
});
