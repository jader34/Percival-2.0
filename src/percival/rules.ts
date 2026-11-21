import type { Ability, Advancement, CalculationContext, PercivalRecord, Scores, Skill } from './types.ts';
import { LEGACY_EXTRA_SPELLS, OATH_SPELLS, PALADIN_SPELLS, SPELL_SLOTS, XP_THRESHOLDS } from './tables.ts';
import { CONFIRMED_FEATURES } from './features.ts';

const ABILITIES: Ability[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const SKILLS: Record<Skill, { name: string; ability: Ability }> = {
  acrobatics: { name: 'Acrobacia', ability: 'dex' },
  animalHandling: { name: 'Adestrar Animais', ability: 'wis' },
  arcana: { name: 'Arcanismo', ability: 'int' },
  athletics: { name: 'Atletismo', ability: 'str' },
  deception: { name: 'Enganação', ability: 'cha' },
  history: { name: 'História', ability: 'int' },
  insight: { name: 'Intuição', ability: 'wis' },
  intimidation: { name: 'Intimidação', ability: 'cha' },
  investigation: { name: 'Investigação', ability: 'int' },
  medicine: { name: 'Medicina', ability: 'wis' },
  nature: { name: 'Natureza', ability: 'int' },
  perception: { name: 'Percepção', ability: 'wis' },
  performance: { name: 'Atuação', ability: 'cha' },
  persuasion: { name: 'Persuasão', ability: 'cha' },
  religion: { name: 'Religião', ability: 'int' },
  sleightOfHand: { name: 'Prestidigitação', ability: 'dex' },
  stealth: { name: 'Furtividade', ability: 'dex' },
  survival: { name: 'Sobrevivência', ability: 'wis' },
};
const modifier = (score: number) => Math.floor((score - 10) / 2);
const scoreMap = (fn: (ability: Ability) => number): Scores =>
  Object.fromEntries(ABILITIES.map((ability) => [ability, fn(ability)])) as Scores;

const IMPROVEMENT_LEVELS = [8, 12, 16, 19];

function integer(value: number, min: number, max: number, label: string) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new RangeError(`${label}: informe um inteiro entre ${min} e ${max}.`);
  }
}

function validateFlags(flags: object) {
  for (const [key, value] of Object.entries(flags)) {
    if (value !== undefined && typeof value !== 'boolean') throw new TypeError(`${key} precisa ser booleano.`);
  }
}

function progression(record: PercivalRecord) {
  if (record.schemaVersion !== 1 || record.id !== 'percival' || record.class !== 'paladin'
    || record.race !== 'variant-human' || record.background !== 'soldier' || record.diceMode !== 'physical-only'
    || record.fightingStyle !== 'great-weapon-fighting' || record.oath.id !== 'blood' || record.oath.spellList !== 'vengeance'
    || record.baseline.level !== 6 || record.baseline.hpMax !== 64) {
    throw new Error('Esta base é exclusiva do Percival, paladino nível 6 com 64 PV de referência.');
  }
  integer(record.xp, 0, Number.MAX_SAFE_INTEGER, 'XP');
  if (record.proficientSkills.some((skill) => !Object.hasOwn(SKILLS, skill))
    || new Set(record.proficientSkills).size !== record.proficientSkills.length) throw new Error('Perícias inválidas ou repetidas.');
  if (record.creation.extraHumanSkill && (!Object.hasOwn(SKILLS, record.creation.extraHumanSkill)
    || record.proficientSkills.includes(record.creation.extraHumanSkill))) throw new Error('A perícia humana deve ser válida e diferente das já registradas.');
  if (new Set(record.equipment.map((item) => item.id)).size !== record.equipment.length) throw new Error('IDs de equipamento repetidos.');
  for (const item of record.equipment) {
    integer(item.quantity, 0, Number.MAX_SAFE_INTEGER, `Quantidade de ${item.name}`);
    if (typeof item.equipped !== 'boolean') throw new TypeError('Equipado precisa ser booleano.');
    if (item.attuned != null && typeof item.attuned !== 'boolean') throw new TypeError('Sintonização precisa ser booleana ou nula.');
  }
  if (!record.mount || record.mount.id !== 'warhorse' || record.mount.species !== 'Cavalo de Guerra'
    || record.mount.hpMax !== 19 || record.mount.hitDice?.count !== 3 || record.mount.hitDice?.die !== 'd10'
    || record.mount.armor?.id !== 'splint-barding' || record.mount.armor.armorClass !== 17
    || typeof record.mount.armor.equipped !== 'boolean') {
    throw new Error('Montaria inválida: esperado Cavalo de Guerra com 19 PV e Cota de talas.');
  }
  for (const ability of ABILITIES) integer(record.mount.abilities[ability], 1, 20, `Atributo ${ability} da montaria`);
  const abilities = { ...record.baseline.abilities };
  for (const ability of ABILITIES) integer(abilities[ability], 1, 20, `Atributo ${ability}`);
  let level: number = record.baseline.level;
  let physicalHitDiceTotal = 0;
  for (const entry of record.advancements) {
    integer(entry.level, 7, 20, 'Nível');
    if (entry.level !== level + 1) throw new Error('A evolução deve ser sequencial, sem níveis repetidos ou saltados.');
    integer(entry.hitDieResult, 1, 10, `d10 físico do nível ${entry.level}`);
    const needsChoice = IMPROVEMENT_LEVELS.includes(entry.level);
    if (needsChoice && !entry.improvement) throw new Error(`Informe a escolha de atributo ou talento do nível ${entry.level}.`);
    if (!needsChoice && entry.improvement) throw new Error(`Não há incremento de atributo no nível ${entry.level}.`);
    if (entry.improvement?.kind === 'ability') {
      const changes = Object.entries(entry.improvement.increases);
      if (changes.some(([key, value]) => !ABILITIES.includes(key as Ability) || !Number.isInteger(value) || value < 1 || value > 2)
        || changes.reduce((sum, [, value]) => sum + value, 0) !== 2) {
        throw new Error('Incremento inválido: escolha +2 em um atributo ou +1 em dois atributos.');
      }
      for (const [key, value] of changes) {
        const ability = key as Ability;
        if (abilities[ability] + value > 20) throw new Error('Um incremento não pode elevar um atributo acima de 20.');
        abilities[ability] += value;
      }
    } else if (entry.improvement?.kind === 'feat') {
      throw new Error(`Talento "${entry.improvement.name}" não automatizado. Implemente e teste seus efeitos antes de registrar esta evolução.`);
    } else if (entry.improvement) {
      throw new Error('Incremento inválido: este tipo de escolha ainda não foi implementado.');
    }
    physicalHitDiceTotal += entry.hitDieResult;
    level = entry.level;
  }
  // PHB p.179: Constituição recalculada como se o modificador atual existisse desde o nível 1.
  const hpMax = record.baseline.hpMax - record.baseline.level * modifier(record.baseline.abilities.con)
    + physicalHitDiceTotal + level * modifier(abilities.con);
  return { level, abilities, hpMax };
}

/** Registra apenas UM nível e retorna uma cópia, sem alterar XP ou recursos de sessão. */
export function levelUp(record: PercivalRecord, choice: Omit<Advancement, 'level'>): PercivalRecord {
  const current = progression(record);
  if (current.level >= 20) throw new Error('Percival já está no nível máximo 20.');
  const updated = structuredClone(record);
  updated.advancements.push({ ...structuredClone(choice), level: current.level + 1 });
  progression(updated);
  return updated;
}

function spellcasting(record: PercivalRecord, level: number, charisma: number, proficiency: number, itemBonus: number) {
  const slots = [...SPELL_SLOTS[level]];
  const preparedLimit = Math.max(1, charisma + Math.floor(level / 2));
  const oathSpells = OATH_SPELLS.filter((spell) => spell.paladinLevel <= level);
  const grants = LEGACY_EXTRA_SPELLS.filter((spell) => record.additionalSpellAccess[spell.id] === true);
  const available = new Map([...PALADIN_SPELLS, ...oathSpells, ...grants]
    .filter((spell) => slots[spell.level - 1] > 0).map((spell) => [spell.id, spell]));
  const catalog = new Map([...PALADIN_SPELLS, ...OATH_SPELLS, ...LEGACY_EXTRA_SPELLS].map((spell) => [spell.id, spell]));
  const oathIds = new Set(oathSpells.map((spell) => spell.id));
  if (new Set(record.preparedSpellIds).size !== record.preparedSpellIds.length) throw new Error('Magia preparada repetida.');
  const unresolvedPreparedSpellIds: string[] = [];
  const preparedSpells = record.preparedSpellIds.flatMap((id) => {
    const spell = catalog.get(id);
    if (!spell) throw new Error(`Magia desconhecida: ${id}.`);
    if (!slots[spell.level - 1]) throw new Error(`Não há espaço do nível necessário para preparar ${spell.name}.`);
    if (oathIds.has(id)) return [];
    if (!available.has(id)) {
      if (!LEGACY_EXTRA_SPELLS.some((extra) => extra.id === id)) throw new Error(`Magia indisponível neste nível: ${spell.name}.`);
      unresolvedPreparedSpellIds.push(id);
      return [];
    }
    return [{ ...spell }];
  });
  // Saves antigos podiam guardar concessões pendentes além da cota validada.
  // Preserve essas seleções para correção explícita, sem descartar ficha/histórico.
  const ordinaryPrepared = preparedSpells.filter(spell => !LEGACY_EXTRA_SPELLS.some(extra => extra.id === spell.id));
  if (ordinaryPrepared.length > preparedLimit) throw new Error(`Limite de ${preparedLimit} magias preparadas excedido.`);
  return {
    ability: 'cha', baseSaveDC: 8 + proficiency + charisma, baseAttackBonus: proficiency + charisma,
    saveDC: 8 + proficiency + charisma + itemBonus, attackBonus: proficiency + charisma + itemBonus, itemBonus,
    preparedLimit, preparedCount: preparedSpells.length, slots,
    preparedSpells, oathSpells: oathSpells.map((spell) => ({ ...spell })),
    availableSpells: [...available.values()].map((spell) => ({ ...spell })), unresolvedPreparedSpellIds,
  };
}

/** Expressão de dados a rolar na mesa, sem sortear resultado nem gastar espaço. */
export function divineSmite(record: PercivalRecord, slotLevel: number, options: { fiendOrUndead?: boolean; critical?: boolean } = {}) {
  validateFlags(options);
  const { level } = progression(record);
  integer(slotLevel, 1, 5, 'Círculo do espaço');
  if (!SPELL_SLOTS[level][slotLevel - 1]) throw new Error('Percival não tem espaço deste círculo no nível atual.');
  const dice = (Math.min(slotLevel + 1, 5) + (options.fiendOrUndead ? 1 : 0)) * (options.critical ? 2 : 1);
  return { dice, die: 8, expression: `${dice}d8`, damageType: 'radiant', rollMode: 'physical-only', source: 'PHB:111' };
}

/** Função pura: não rola dados, não salva arquivos e não altera o registro recebido. */
export function calculatePercival(record: PercivalRecord, context: CalculationContext = {}) {
  validateFlags(context);
  const { level, abilities, hpMax } = progression(record);
  const modifiers = scoreMap((ability) => modifier(abilities[ability]));
  const proficiencyBonus = 2 + Math.floor((level - 1) / 4);
  const equipped = (id: string) => record.equipment.some((item) => item.id === id && item.equipped && item.quantity > 0);
  const amuletActive = record.equipment.some((item) => item.id === 'amulet-of-the-devout'
    && item.quantity > 0 && item.equipped && item.attuned === true);
  const conscious = context.conscious ?? true;
  const blessingActive = conscious && !!context.bloodBlessingActive && equipped('halberd');
  const veilActive = !!context.bloodVeilActive && equipped('blood-veil-cloak');
  const auraBonus = conscious ? Math.max(1, modifiers.cha) : 0;
  const attackBonus = modifiers.str + proficiencyBonus + (blessingActive ? Math.max(1, modifiers.cha) : 0);
  const magic = spellcasting(record, level, modifiers.cha, proficiencyBonus, amuletActive ? 1 : 0);
  const warnings: { code: string; message: string }[] = [];
  if (magic.preparedCount > magic.preparedLimit) warnings.push({ code: 'prepared-limit',
    message: `As concessões confirmadas deixam ${magic.preparedCount} magias selecionadas para ${magic.preparedLimit} preparações. Desmarque o excesso em Magias antes de conjurar magias preparadas; nenhuma seleção foi removida.` });
  if (!record.creation.extraHumanSkill) warnings.push({ code: 'human-skill', message: 'Falta identificar a perícia adicional do humano variante; nenhuma foi inventada.' });
  if (!record.creation.racialAbilityBonuses) warnings.push({ code: 'racial-ability-history', message: 'Atributos atuais preservados; distribuição dos dois +1 raciais não informada. Não reaplicar bônus raciais.' });
  if (!record.creation.extraLanguage) warnings.push({ code: 'human-language', message: 'Idioma humano adicional não informado; Comum está garantido pelo livro.' });
  if (!record.creation.gamingSet) warnings.push({ code: 'soldier-gaming-set', message: 'Falta escolher/identificar o kit de jogo de Soldado; veículos terrestres estão garantidos.' });
  if (record.equipment.some((item) => item.id === 'amulet-of-the-devout' && item.equipped && item.attuned == null)) {
    warnings.push({ code: 'amulet-attunement', message: 'Confirme a sintonização do amuleto; seu +1 e seu uso adicional ainda não foram somados.' });
  }
  for (const id of magic.unresolvedPreparedSpellIds) warnings.push({ code: `extra-spell-${id}`,
    message: `A magia ${id} está no cadastro antigo, mas não na lista de paladino do livro local. Confirme a concessão antes de incluí-la na preparação validada.` });
  for (const featureLevel of [7, 15, 20] as const) {
    if (level >= featureLevel) warnings.push({ code: `oath-feature-${featureLevel}`,
      message: record.oath.futureFeatures[featureLevel]
        ? `A característica homebrew do nível ${featureLevel} foi descrita, mas sua automação ainda precisa ser implementada.`
        : `O mestre precisa definir a característica do Juramento de Sangue do nível ${featureLevel}. Não foi concedida a de Vingança.` });
  }
  const proficientSkills = new Set(record.proficientSkills);
  if (record.creation.extraHumanSkill) proficientSkills.add(record.creation.extraHumanSkill);
  const savingThrowsWithoutAura = scoreMap((ability) => modifiers[ability]
    + (ability === 'wis' || ability === 'cha' ? proficiencyBonus : 0));
  const skills = Object.fromEntries(Object.entries(SKILLS).map(([id, definition]) => [id, {
    ...definition,
    proficient: proficientSkills.has(id as Skill),
    bonus: modifiers[definition.ability] + (proficientSkills.has(id as Skill) ? proficiencyBonus : 0),
  }])) as Record<Skill, { name: string; ability: Ability; proficient: boolean; bonus: number }>;
  const mountAbilities = { ...record.mount.abilities };
  const mountModifiers = scoreMap((ability) => modifier(mountAbilities[ability]));
  const mountArmorEquipped = record.mount.armor.equipped;
  const mountArmorClass = mountArmorEquipped ? record.mount.armor.armorClass : 10 + mountModifiers.dex;
  const mountSpeedMeters = mountArmorEquipped && mountAbilities.str < record.mount.armor.strengthRequirement
    ? Math.max(0, record.mount.speedMeters - 3)
    : record.mount.speedMeters;
  return {
    name: record.name, level, abilities, modifiers, proficiencyBonus,
    hpMax,
    hitDice: { maximum: level, die: 'd10', longRestRecovery: Math.max(1, Math.floor(level / 2)), rollMode: 'physical-only' },
    features: CONFIRMED_FEATURES.filter((feature) => feature.level <= level).map((feature) => ({ ...feature })),
    warnings,
    calculationStatus: warnings.length ? 'needs-confirmation' : 'confirmed-rules-only',
    xp: { current: record.xp, currentLevelThreshold: XP_THRESHOLDS[level], nextLevelThreshold: level < 20 ? XP_THRESHOLDS[level + 1] : null,
      levelUpAutomatic: false },
    nextLevel: level < 20 ? { level: level + 1, requiresPhysicalD10: true,
      requiresImprovementChoice: IMPROVEMENT_LEVELS.includes(level + 1), requiresHomebrewDefinition: [7, 15, 20].includes(level + 1) } : null,
    armorClass: (equipped('plate') ? 18 : 10 + modifiers.dex) + (veilActive ? 2 : 0),
    speedMeters: equipped('plate') && abilities.str < 15 ? 6 : 9,
    stealthDisadvantage: equipped('plate'),
    initiative: modifiers.dex,
    passivePerception: 10 + skills.perception.bonus,
    skills,
    savingThrowsWithoutAura,
    savingThrows: scoreMap((ability) => savingThrowsWithoutAura[ability] + auraBonus + (veilActive && ability === 'dex' ? 2 : 0)),
    auras: {
      protection: { active: conscious, bonus: auraBonus, radiusMeters: level >= 18 ? 9 : 3 },
      courage: { available: level >= 10, active: level >= 10 && conscious, radiusMeters: level >= 10 ? (level >= 18 ? 9 : 3) : 0 },
    },
    spellcasting: magic,
    homebrew: {
      bloodBlessing: { active: blessingActive, attackBonus: Math.max(1, modifiers.cha), markedTargetExtraDamage: modifiers.cha,
        damageType: 'radiant', durationSeconds: 60, brightLightMeters: 3, additionalDimLightMeters: 3, resource: 'channelDivinity',
        description: record.oath.homebrewText.bloodBlessing },
      absorbVitality: { action: 'action', range: 'touch', saveAbility: 'con', saveDC: magic.saveDC,
        condition: 'restrained', repeatSave: 'end-of-target-turn', resource: 'channelDivinity',
        description: record.oath.homebrewText.absorbVitality },
      bloodVeil: { active: veilActive, armorClassBonus: 2, dexteritySaveBonus: 2, radiusMeters: 1.5, durationSeconds: 60 },
    },
    attacks: {
      perAttackAction: 2,
      improvedDivineSmite: level >= 11 ? '1d8' : null,
      halberd: { toHit: attackBonus, damage: `1d10 + ${modifiers.str}`, reachMeters: 3 },
      polearmButt: { toHit: attackBonus, damage: `1d4 + ${modifiers.str}`, action: 'bonus' },
    },
    mount: {
      id: record.mount.id,
      name: record.mount.name,
      species: record.mount.species,
      size: record.mount.size,
      creatureType: record.mount.creatureType,
      hpMax: record.mount.hpMax,
      hitDice: {
        maximum: record.mount.hitDice.count,
        die: record.mount.hitDice.die,
        conModifier: mountModifiers.con,
        longRestRecovery: Math.max(1, Math.floor(record.mount.hitDice.count / 2)),
        rollMode: 'physical-only' as const,
      },
      abilities: mountAbilities,
      modifiers: mountModifiers,
      armorClass: mountArmorClass,
      armorClassMountedWithVeil: mountArmorClass + (veilActive ? 2 : 0),
      speedMeters: mountSpeedMeters,
      initiative: mountModifiers.dex,
      passivePerception: 10 + mountModifiers.wis,
      stealthDisadvantage: mountArmorEquipped && record.mount.armor.stealthDisadvantage,
      savingThrowsWithoutAura: { ...mountModifiers },
      savingThrowsWithAura: scoreMap((ability) => mountModifiers[ability] + auraBonus + (veilActive && ability === 'dex' ? 2 : 0)),
      armor: { ...record.mount.armor },
      attack: { ...record.mount.attack },
      traits: record.mount.traits.map((trait) => ({ ...trait })),
      source: record.mount.source,
    },
    resources: {
      layOnHands: { maximum: 5 * level, recovery: 'long-rest' },
      divineSense: { maximum: 1 + modifiers.cha, recovery: 'long-rest' },
      channelDivinity: { maximum: 1, recovery: 'short-or-long-rest' },
      amuletChannelDivinity: { maximum: amuletActive ? 1 : 0, recovery: 'dawn' },
      bloodVeil: { maximum: equipped('blood-veil-cloak') ? 1 : 0, recovery: 'long-rest' },
      cleansingTouch: { maximum: level >= 14 ? Math.max(1, modifiers.cha) : 0, recovery: 'long-rest' },
    },
  };
}
