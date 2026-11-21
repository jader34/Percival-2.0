import { LEGACY_EXTRA_SPELLS, OATH_SPELLS, PALADIN_SPELLS } from '../percival/tables.ts';
import { PERCIVAL } from '../percival/data.ts';
import { calculatePercival, levelUp } from '../percival/rules.ts';
import type { Improvement, PercivalRecord, Skill } from '../percival/types.ts';

export interface DeathSaves {
  successes: number;
  failures: number;
  stable: boolean;
}
export interface MountSession {
  hp: number;
  tempHp: number;
  hitDiceSpent: number;
}
export interface Session {
  hp: number;
  tempHp: number;
  hitDiceSpent: number;
  deathSaves: DeathSaves;
  mount: MountSession;
  slotsSpent: [number, number, number, number, number];
  resourceSpent: { layOnHands: number; divineSense: number; channelDivinity: number; amuletChannelDivinity: number; bloodVeil: number };
  effects: { bloodBlessing: boolean; bloodVeil: boolean };
  concentration: string | null;
  notes: string;
}
type Snapshot = { record: PercivalRecord; session: Session };
export type AppState = Snapshot & { version: 1; history: Snapshot[]; log: string[] };

export function createAppState(): AppState {
  return {
    version: 1, record: structuredClone(PERCIVAL),
    session: {
      hp: 64, tempHp: 0, hitDiceSpent: 0,
      deathSaves: { successes: 0, failures: 0, stable: false },
      mount: { hp: 19, tempHp: 0, hitDiceSpent: 0 },
      slotsSpent: [0, 0, 0, 0, 0],
      resourceSpent: { layOnHands: 0, divineSense: 0, channelDivinity: 0, amuletChannelDivinity: 0, bloodVeil: 0 },
      effects: { bloodBlessing: false, bloodVeil: false }, concentration: null, notes: '',
    },
    history: [], log: [],
  };
}

export type Action =
  | { type: 'hp'; mode: 'damage' | 'heal' | 'temp'; amount: number; critical?: boolean }
  | { type: 'hit-dice'; count: number; rollTotal: number }
  | { type: 'death-save'; outcome: 'success' | 'failure' | 'nat20' | 'nat1' | 'stabilize' }
  | { type: 'mount-hp'; mode: 'damage' | 'heal' | 'temp'; amount: number }
  | { type: 'mount-hit-dice'; count: number; rollTotal: number }
  | { type: 'mount-armor'; equipped: boolean }
  | { type: 'mount-summon' }
  | { type: 'lay-on-hands'; amount: number; self: boolean }
  | { type: 'use-resource'; resource: 'divineSense' | 'channelDivinity' | 'amuletChannelDivinity' }
  | { type: 'blessing'; source: 'class' | 'amulet' }
  | { type: 'veil' }
  | { type: 'end-effect'; effect: keyof Session['effects'] }
  | { type: 'cast'; spellId: string; slotLevel: number; concentration: boolean }
  | { type: 'smite'; slotLevel: number }
  | { type: 'end-concentration' }
  | { type: 'rest'; kind: 'short' | 'long' | 'dawn' }
  | { type: 'xp'; mode: 'add' | 'set'; amount: number }
  | { type: 'notes'; value: string }
  | { type: 'item-quantity'; id: string; quantity: number }
  | { type: 'equipment'; id: string; equipped: boolean }
  | { type: 'attunement'; value: boolean }
  | { type: 'prepare'; spellId: string }
  | { type: 'level-up'; hitDieResult: number; improvement?: Improvement }
  | { type: 'human-skill'; skill: Skill }
  | { type: 'grant-spell'; id: string; allowed: boolean }
  | { type: 'potion'; healing: number };

function integer(value: number, label: string, maximum = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum) throw new Error(`${label}: informe um inteiro entre 0 e ${maximum}.`);
}

function rangedInteger(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label}: informe um inteiro entre ${minimum} e ${maximum}.`);
  }
}

function boolean(value: unknown, label: string): asserts value is boolean {
  if (typeof value !== 'boolean') throw new Error(`${label} precisa ser booleano.`);
}

function equipped(record: PercivalRecord, id: string) {
  return record.equipment.some(item => item.id === id && item.quantity > 0 && item.equipped);
}

export function applyAction(state: AppState, action: Action): AppState {
  validateState(state);
  state = confirmPercival(state);
  if (!action || typeof action !== 'object' || Array.isArray(action) || typeof action.type !== 'string') throw new Error('Ação inválida.');
  const next = structuredClone(state);
  const session = next.session;
  const sheet = getSheet(state);
  const spend = (resource: keyof Session['resourceSpent'], amount = 1) => {
    integer(amount, 'Quantidade do recurso');
    if (amount > sheet.resources[resource].maximum - session.resourceSpent[resource]) throw new Error('Recurso insuficiente.');
    session.resourceSpent[resource] += amount;
  };
  switch (action.type) {
    case 'potion': {
      integer(action.healing, 'Cura física');
      const potion = next.record.equipment.find(item => item.id === 'greater-healing-potion');
      if (!potion || potion.quantity < 1) throw new Error('Poção de cura indisponível.');
      potion.quantity -= 1;
      session.hp += Math.min(action.healing, sheet.hpMax - session.hp);
      break;
    }
    case 'hit-dice': {
      const remaining = sheet.hitDice.maximum - session.hitDiceSpent;
      if (remaining <= 0) throw new Error('Dados de Vida insuficientes.');
      rangedInteger(action.count, 1, remaining, 'Quantidade de Dados de Vida');
      rangedInteger(action.rollTotal, action.count, action.count * 10, 'Resultado físico dos d10');
      const healing = Math.max(0, action.rollTotal + action.count * sheet.modifiers.con);
      session.hitDiceSpent += action.count;
      session.hp += Math.min(healing, sheet.hpMax - session.hp);
      break;
    }
    case 'death-save': {
      if (session.hp > 0) throw new Error('Salvaguardas contra a morte exigem 0 PV.');
      if (session.deathSaves.failures >= 3) throw new Error('Percival já acumulou 3 falhas contra a morte.');
      switch (action.outcome) {
        case 'stabilize':
          if (session.deathSaves.stable) throw new Error('Percival já está estável.');
          session.deathSaves = { successes: 0, failures: 0, stable: true };
          break;
        case 'nat20':
          session.hp = 1;
          session.deathSaves = { successes: 0, failures: 0, stable: false };
          break;
        case 'success': {
          if (session.deathSaves.stable) throw new Error('Percival já está estável.');
          const successes = session.deathSaves.successes + 1;
          session.deathSaves = successes >= 3
            ? { successes: 0, failures: 0, stable: true }
            : { ...session.deathSaves, successes };
          break;
        }
        case 'failure': {
          const failures = Math.min(3, session.deathSaves.failures + 1);
          session.deathSaves = {
            successes: failures >= 3 ? 0 : session.deathSaves.successes,
            failures,
            stable: false,
          };
          break;
        }
        case 'nat1': {
          const failures = Math.min(3, session.deathSaves.failures + 2);
          session.deathSaves = {
            successes: failures >= 3 ? 0 : session.deathSaves.successes,
            failures,
            stable: false,
          };
          break;
        }
        default:
          throw new Error('Resultado de salvaguarda contra a morte inválido.');
      }
      break;
    }
    case 'mount-hp': {
      integer(action.amount, 'Quantidade de PV da montaria');
      if (action.mode === 'damage') {
        const absorbed = Math.min(session.mount.tempHp, action.amount);
        session.mount.tempHp -= absorbed;
        session.mount.hp = Math.max(0, session.mount.hp - (action.amount - absorbed));
      } else if (action.mode === 'heal') {
        session.mount.hp += Math.min(action.amount, sheet.mount.hpMax - session.mount.hp);
      } else if (action.mode === 'temp') {
        session.mount.tempHp = Math.max(session.mount.tempHp, action.amount);
      } else throw new Error('Modo de PV da montaria inválido.');
      break;
    }
    case 'mount-hit-dice': {
      const remaining = sheet.mount.hitDice.maximum - session.mount.hitDiceSpent;
      if (remaining <= 0) throw new Error('Dados de Vida da montaria insuficientes.');
      rangedInteger(action.count, 1, remaining, 'Dados de Vida da montaria');
      rangedInteger(action.rollTotal, action.count, action.count * 10, 'Resultado físico dos d10 da montaria');
      const healing = Math.max(0, action.rollTotal + action.count * sheet.mount.hitDice.conModifier);
      session.mount.hitDiceSpent += action.count;
      session.mount.hp += Math.min(healing, sheet.mount.hpMax - session.mount.hp);
      break;
    }
    case 'mount-armor':
      boolean(action.equipped, 'Armadura da montaria');
      next.record.mount.armor.equipped = action.equipped;
      break;
    case 'mount-summon':
      session.mount = { hp: sheet.mount.hpMax, tempHp: 0, hitDiceSpent: 0 };
      break;
    case 'prepare': {
      if (OATH_SPELLS.some(spell => spell.id === action.spellId)) throw new Error('Magias do juramento são sempre preparadas no nível apropriado.');
      const prepared = next.record.preparedSpellIds;
      if (prepared.includes(action.spellId)) next.record.preparedSpellIds = prepared.filter(id => id !== action.spellId);
      else {
        if (!sheet.spellcasting.availableSpells.some(spell => spell.id === action.spellId)) throw new Error('Magia não disponível para preparação.');
        if (sheet.spellcasting.preparedCount >= sheet.spellcasting.preparedLimit) throw new Error(`Limite de ${sheet.spellcasting.preparedLimit} magias preparadas atingido. Desmarque uma preparação primeiro.`);
        prepared.push(action.spellId);
      }
      calculatePercival(next.record);
      break;
    }
    case 'grant-spell':
      boolean(action.allowed, 'Concessão');
      if (!LEGACY_EXTRA_SPELLS.some(spell => spell.id === action.id)) throw new Error('Concessão de magia inválida.');
      if (!action.allowed) throw new Error('Concessão permanente confirmada pela mesa.');
      return state;
    case 'human-skill':
      if (typeof action.skill !== 'string' || !Object.hasOwn(sheet.skills, action.skill)) throw new Error('Perícia humana inválida.');
      next.record.creation.extraHumanSkill = action.skill;
      calculatePercival(next.record);
      break;
    case 'level-up':
      next.record = levelUp(next.record, { hitDieResult: action.hitDieResult, ...(action.improvement === undefined ? {} : { improvement: action.improvement }) });
      break;
    case 'xp':
      if (action.mode === 'add') {
        rangedInteger(action.amount, 1, 10_000_000, 'XP ganho');
        integer(next.record.xp + action.amount, 'XP total');
        next.record.xp += action.amount;
      } else if (action.mode === 'set') {
        integer(action.amount, 'XP total', 10_000_000);
        next.record.xp = action.amount;
      } else throw new Error('Modo de XP inválido.');
      calculatePercival(next.record);
      break;
    case 'notes':
      if (typeof action.value !== 'string') throw new Error('Notas precisam ser texto.');
      session.notes = action.value;
      break;
    case 'attunement':
      boolean(action.value, 'Sintonização');
      if (!action.value) throw new Error('Sintonização permanente confirmada pela mesa.');
      return state;
    case 'equipment':
    case 'item-quantity':
    {
      const id = action.id;
      const item = next.record.equipment.find(item => item.id === id);
      if (!item) throw new Error('Item não encontrado.');
      if (action.type === 'item-quantity') {
        integer(action.quantity, 'Quantidade do item');
        item.quantity = action.quantity;
      } else {
        boolean(action.equipped, 'Equipado');
        item.equipped = action.equipped;
      }
      if (!equipped(next.record, 'halberd')) session.effects.bloodBlessing = false;
      if (!equipped(next.record, 'blood-veil-cloak')) session.effects.bloodVeil = false;
      break;
    }
    case 'rest':
      if (action.kind === 'short') session.resourceSpent.channelDivinity = 0;
      else if (action.kind === 'dawn') session.resourceSpent.amuletChannelDivinity = 0;
      else if (action.kind === 'long') {
        session.hp = sheet.hpMax;
        session.tempHp = 0;
        session.hitDiceSpent = Math.max(0, session.hitDiceSpent - sheet.hitDice.longRestRecovery);
        session.deathSaves = { successes: 0, failures: 0, stable: false };
        if (session.mount.hp > 0) {
          session.mount.hp = sheet.mount.hpMax;
          session.mount.hitDiceSpent = Math.max(0, session.mount.hitDiceSpent - sheet.mount.hitDice.longRestRecovery);
        }
        session.mount.tempHp = 0;
        session.slotsSpent = [0, 0, 0, 0, 0];
        session.resourceSpent = { layOnHands: 0, divineSense: 0, channelDivinity: 0, bloodVeil: 0,
          amuletChannelDivinity: session.resourceSpent.amuletChannelDivinity };
        session.effects = { bloodBlessing: false, bloodVeil: false };
        session.concentration = null;
      } else throw new Error('Tipo de descanso inválido.');
      break;
    case 'cast':
    case 'smite': {
      integer(action.slotLevel, 'Círculo', 5);
      if (action.slotLevel === 0) throw new Error('Informe um círculo de 1 a 5.');
      if (action.type === 'cast') {
        boolean(action.concentration, 'Concentração');
        if (sheet.spellcasting.preparedCount > sheet.spellcasting.preparedLimit
          && !sheet.spellcasting.oathSpells.some(spell => spell.id === action.spellId)) {
          throw new Error('Limite de magias preparadas excedido. Desmarque o excesso em Magias antes de conjurar.');
        }
        const spell = [...sheet.spellcasting.preparedSpells, ...sheet.spellcasting.oathSpells].find(spell => spell.id === action.spellId);
        if (!spell) throw new Error('Magia não está preparada ou disponível pelo juramento.');
        if (spell.level > action.slotLevel) throw new Error('O círculo do espaço é insuficiente para esta magia.');
        if (action.concentration) session.concentration = action.spellId;
      }
      const index = action.slotLevel - 1;
      if (session.slotsSpent[index] >= sheet.spellcasting.slots[index]) throw new Error('Espaço de magia insuficiente.');
      session.slotsSpent[index] += 1;
      if (action.type === 'cast' && action.spellId === 'find-steed') {
        session.mount = { hp: sheet.mount.hpMax, tempHp: 0, hitDiceSpent: 0 };
      }
      break;
    }
    case 'end-concentration':
      session.concentration = null;
      break;
    case 'lay-on-hands':
      integer(action.amount, 'Quantidade do recurso');
      boolean(action.self, 'Cura própria');
      spend('layOnHands', action.amount);
      if (action.self) session.hp += Math.min(action.amount, sheet.hpMax - session.hp);
      break;
    case 'use-resource':
      if (!['divineSense', 'channelDivinity', 'amuletChannelDivinity'].includes(action.resource)) throw new Error('Recurso inválido.');
      spend(action.resource);
      break;
    case 'blessing':
      if (!['class', 'amulet'].includes(action.source)) throw new Error('Fonte de bênção inválida.');
      if (session.effects.bloodBlessing) throw new Error('Bênção já está ativa.');
      if (session.hp === 0 || !equipped(next.record, 'halberd')) throw new Error('Bênção exige consciência e arma equipada.');
      spend(action.source === 'class' ? 'channelDivinity' : 'amuletChannelDivinity');
      session.effects.bloodBlessing = true;
      break;
    case 'veil':
      if (session.effects.bloodVeil) throw new Error('Véu já está ativo.');
      spend('bloodVeil');
      session.effects.bloodVeil = true;
      break;
    case 'end-effect':
      if (!['bloodBlessing', 'bloodVeil'].includes(action.effect)) throw new Error('Efeito inválido.');
      session.effects[action.effect] = false;
      break;
    case 'hp': {
      integer(action.amount, 'Quantidade de PV');
      if (action.critical !== undefined) boolean(action.critical, 'Crítico');
      if (action.mode === 'damage') {
        const wasAtZero = session.hp === 0;
        const absorbed = Math.min(session.tempHp, action.amount);
        session.tempHp -= absorbed;
        const unabsorbed = action.amount - absorbed;
        session.hp = Math.max(0, session.hp - unabsorbed);
        if (wasAtZero && unabsorbed > 0 && session.deathSaves.failures < 3) {
          const failures = Math.min(3, session.deathSaves.failures + (action.critical ? 2 : 1));
          session.deathSaves = {
            successes: failures >= 3 ? 0 : session.deathSaves.successes,
            failures,
            stable: false,
          };
        }
      } else if (action.mode === 'heal') {
        session.hp += Math.min(action.amount, sheet.hpMax - session.hp);
      } else if (action.mode === 'temp') {
        session.tempHp = Math.max(session.tempHp, action.amount);
      } else throw new Error('Modo de PV inválido.');
      break;
    }
    default: throw new Error('Ação inválida.');
  }
  if (session.hp > 0) {
    session.deathSaves = { successes: 0, failures: 0, stable: false };
  } else {
    session.effects.bloodBlessing = false;
    session.concentration = null;
  }
  validateSnapshot({ record: next.record, session: next.session });
  next.history = [...next.history, structuredClone({ record: state.record, session: state.session })].slice(-20);
  const labels: Record<Action['type'], string> = {
    hp: 'PV atualizados', 'hit-dice': 'Dados de Vida gastos', 'death-save': 'Salvaguarda contra a morte',
    'mount-hp': 'PV da montaria atualizados', 'mount-hit-dice': 'Dados de Vida da montaria',
    'mount-armor': 'Armadura da montaria atualizada', 'mount-summon': 'Montaria convocada',
    'lay-on-hands': 'Impor as Mãos', 'use-resource': 'Recurso utilizado',
    blessing: 'Bênção de Sangue ativada', veil: 'Véu de Sangue ativado', 'end-effect': 'Efeito encerrado',
    cast: 'Magia conjurada', smite: 'Destruição Divina', 'end-concentration': 'Concentração encerrada',
    rest: 'Descanso registrado', xp: 'XP atualizado', notes: 'Notas atualizadas', 'item-quantity': 'Quantidade atualizada',
    equipment: 'Equipamento atualizado', attunement: 'Sintonização atualizada', prepare: 'Preparação atualizada',
    'level-up': 'Nível elevado', 'human-skill': 'Perícia humana registrada', 'grant-spell': 'Concessão atualizada',
    potion: 'Poção de cura consumida',
  };
  next.log.unshift(`${labels[action.type]}.`);
  return next;
}

export function undo(state: AppState): AppState {
  validateState(state);
  const next = confirmPercival(state);
  const snapshot = next.history.pop();
  if (!snapshot) return next;
  next.record = snapshot.record;
  next.session = snapshot.session;
  next.log.unshift('Última ação desfeita.');
  return next;
}

// Esquemas fechados: importar JSON nunca executa texto nem aceita campos arbitrários.
type Check = (value: unknown, path: string) => void;
const text: Check = (value, path) => { if (typeof value !== 'string') throw new Error(`${path}: texto inválido.`); };
const natural: Check = (value, path) => integer(value as number, path);
const flag: Check = (value, path) => boolean(value, path);
const choice = (...values: unknown[]): Check => (value, path) => {
  if (!values.includes(value)) throw new Error(`${path}: valor inválido.`);
};
const nullable = (check: Check): Check => (value, path) => { if (value !== null) check(value, path); };
const list = (check: Check, maximum = Number.MAX_SAFE_INTEGER): Check => (value, path) => {
  if (!Array.isArray(value) || value.length > maximum) throw new Error(`${path}: lista inválida.`);
  for (let index = 0; index < value.length; index++) check(value[index], `${path}[${index}]`);
};
const shape = (required: Record<string, Check>, optional: Record<string, Check> = {}): Check => (value, path) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new Error(`${path}: objeto inválido.`);
  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!Object.hasOwn(required, key) && !Object.hasOwn(optional, key)) throw new Error(`${path}.${key}: campo inválido.`);
  }
  for (const [key, check] of Object.entries(required)) {
    if (!Object.hasOwn(obj, key)) throw new Error(`${path}.${key}: campo obrigatório inválido.`);
    check(obj[key], `${path}.${key}`);
  }
  for (const [key, check] of Object.entries(optional)) if (Object.hasOwn(obj, key)) check(obj[key], `${path}.${key}`);
};
const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const scores = Object.fromEntries(abilities.map(ability => [ability, natural]));
const skill = choice(...Object.keys(calculatePercival(PERCIVAL).skills));
const featureSchema = shape({ name: text, description: text, source: text });
const improvementSchema: Check = (value, path) => {
  if (value && typeof value === 'object' && 'kind' in value && value.kind === 'ability') {
    shape({ kind: choice('ability'), increases: shape({}, scores) })(value, path);
  } else shape({ kind: choice('feat'), name: text, description: text, source: text })(value, path);
};
const racialBonuses: Check = (value, path) => {
  if (value === null) return;
  list(choice(...abilities), 2)(value, path);
  const pair = value as unknown[];
  if (pair.length !== 2 || pair[0] === pair[1]) throw new Error(`${path}: bônus raciais inválidos.`);
};
const weight: Check = (value, path) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) throw new Error(`${path}: peso inválido.`);
};
const mountTraitSchema = shape({ id: text, name: text, description: text });
const mountRecordSchema = shape({
  id: choice('warhorse'),
  name: text,
  species: choice('Cavalo de Guerra'),
  size: choice('Grande'),
  creatureType: choice('Besta'),
  hpMax: choice(19),
  hitDice: shape({ count: choice(3), die: choice('d10') }),
  baseArmorClass: choice(11),
  speedMeters: choice(18),
  abilities: shape(scores),
  armor: shape({
    id: choice('splint-barding'),
    name: text,
    armorClass: choice(17),
    strengthRequirement: choice(15),
    stealthDisadvantage: flag,
    weightKg: weight,
    equipped: flag,
    source: text,
  }),
  attack: shape({
    name: text,
    toHit: natural,
    reachMeters: weight,
    damage: text,
    damageType: text,
  }),
  traits: list(mountTraitSchema, 10),
  source: text,
});
const recordSchema = shape({
  schemaVersion: choice(1), id: choice('percival'), name: text,
  class: choice('paladin'), race: choice('variant-human'), background: choice('soldier'),
  baseline: shape({ level: choice(6), hpMax: choice(64), abilities: shape(scores) }),
  xp: natural, progressionMode: choice('dm-confirmed'), diceMode: choice('physical-only'),
  advancements: list(shape({ level: natural, hitDieResult: natural }, { improvement: improvementSchema }), 14),
  creation: shape({ feat: choice('polearm-master'), racialAbilityBonuses: racialBonuses,
    extraHumanSkill: nullable(skill), extraLanguage: nullable(text), gamingSet: nullable(text),
    level4Improvement: shape({ cha: choice(2) }) }),
  proficientSkills: list(skill, 18), fightingStyle: choice('great-weapon-fighting'),
  equipment: list(shape({ id: text, name: text, quantity: natural, weightKg: weight,
    equipped: flag, source: text, description: text }, { attuned: nullable(flag) })),
  coins: shape({ gp: natural, sp: natural, cp: natural }), preparedSpellIds: list(text),
  additionalSpellAccess: shape({}, Object.fromEntries(LEGACY_EXTRA_SPELLS.map(spell => [spell.id, nullable(flag)]))),
  oath: shape({ id: choice('blood'), spellList: choice('vengeance'),
    homebrewText: shape({ absorbVitality: text, bloodBlessing: text }),
    futureFeatures: shape({}, { 7: featureSchema, 15: featureSchema, 20: featureSchema }) }),
  mount: mountRecordSchema, notes: text,
});
const sessionSchema = shape({
  hp: natural, tempHp: natural, hitDiceSpent: natural,
  deathSaves: shape({ successes: natural, failures: natural, stable: flag }),
  mount: shape({ hp: natural, tempHp: natural, hitDiceSpent: natural }),
  slotsSpent: list(natural, 5),
  resourceSpent: shape({ layOnHands: natural, divineSense: natural, channelDivinity: natural,
    amuletChannelDivinity: natural, bloodVeil: natural }),
  effects: shape({ bloodBlessing: flag, bloodVeil: flag }), concentration: nullable(text), notes: text,
});

function validateSnapshot(value: unknown): asserts value is Snapshot {
  shape({ record: recordSchema, session: sessionSchema })(value, 'Estado');
  const { record, session } = value as Snapshot;
  const sheet = calculatePercival(record);
  integer(session.hp, 'PV', sheet.hpMax);
  integer(session.hitDiceSpent, 'Dados de Vida gastos', sheet.hitDice.maximum);
  integer(session.deathSaves.successes, 'Sucessos contra a morte', 2);
  integer(session.deathSaves.failures, 'Falhas contra a morte', 3);
  if (session.hp > 0 && (session.deathSaves.successes !== 0 || session.deathSaves.failures !== 0 || session.deathSaves.stable)) {
    throw new Error('Salvaguardas contra a morte incoerentes com PV acima de zero.');
  }
  if (session.deathSaves.stable && (session.deathSaves.successes !== 0 || session.deathSaves.failures !== 0)) {
    throw new Error('Estado estável incoerente com contadores de morte.');
  }
  integer(session.mount.hp, 'PV da montaria', sheet.mount.hpMax);
  integer(session.mount.hitDiceSpent, 'Dados de Vida gastos da montaria', sheet.mount.hitDice.maximum);
  if (session.slotsSpent.length !== 5) throw new Error('Espaços de magia: tamanho inválido.');
  session.slotsSpent.forEach((spent, index) => integer(spent, `Espaços do círculo ${index + 1}`, sheet.spellcasting.slots[index]));
  for (const resource of Object.keys(session.resourceSpent) as (keyof Session['resourceSpent'])[]) {
    // Gasto persiste ao tirar um item: não recuperar usos ao reequipar/sintonizar.
    const maximum = resource === 'amuletChannelDivinity' || resource === 'bloodVeil' ? 1 : sheet.resources[resource].maximum;
    integer(session.resourceSpent[resource], `Gasto de ${resource}`, maximum);
  }
  if (session.effects.bloodBlessing && (session.hp === 0 || !equipped(record, 'halberd'))) throw new Error('Bênção de Sangue incoerente com consciência ou equipamento.');
  if (session.effects.bloodVeil && (!equipped(record, 'blood-veil-cloak') || session.resourceSpent.bloodVeil !== 1)) throw new Error('Véu de Sangue incoerente com equipamento ou gasto.');
  if (session.concentration !== null) {
    const spell = [...PALADIN_SPELLS, ...OATH_SPELLS, ...LEGACY_EXTRA_SPELLS].find(spell => spell.id === session.concentration);
    if (!spell || session.hp === 0 || !sheet.spellcasting.slots[spell.level - 1]) throw new Error('Concentração inválida ou incoerente.');
  }
}

function validateState(value: unknown): asserts value is AppState {
  shape({ version: choice(1), record: recordSchema, session: sessionSchema,
    history: list((snapshot) => validateSnapshot(snapshot), 20), log: list(text) })(value, 'Estado');
  const state = value as AppState;
  validateSnapshot({ record: state.record, session: state.session });
}

export function serialize(state: AppState): string {
  validateState(state);
  return JSON.stringify(confirmPercival(state));
}

/** Confirmações permanentes da ficha exclusiva; não são ações nem recuperam recursos. */
function confirmPercival(state: AppState): AppState {
  const next = structuredClone(state);
  for (const { record } of [next, ...next.history]) {
    const amulet = record.equipment.find(item => item.id === 'amulet-of-the-devout');
    if (amulet) amulet.attuned = true;
    for (const id of ['warding-bond', 'prayer-of-healing', 'gentle-repose']) {
      record.additionalSpellAccess[id] = true;
    }
  }
  return next;
}

/** Importa somente o envelope v1; preserva e valida todos os snapshots (máximo 20). */
export function parseBackup(text: string): AppState {
  if (typeof text !== 'string') throw new Error('Backup precisa ser texto JSON.');
  let value: unknown;
  try { value = JSON.parse(text); }
  catch { throw new Error('Backup JSON inválido.'); }
  validateState(value);
  const confirmed = confirmPercival(value);
  validateState(confirmed);
  return confirmed;
}

export function getSheet(state: AppState): ReturnType<typeof calculatePercival> {
  return calculatePercival(state.record, {
    conscious: state.session.hp > 0,
    bloodBlessingActive: state.session.hp > 0 && state.session.effects.bloodBlessing,
    bloodVeilActive: state.session.effects.bloodVeil,
  });
}
