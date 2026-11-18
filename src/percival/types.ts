export type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export type Scores = Record<Ability, number>;
export type Skill = 'acrobatics' | 'animalHandling' | 'arcana' | 'athletics' | 'deception'
  | 'history' | 'insight' | 'intimidation' | 'investigation' | 'medicine' | 'nature'
  | 'perception' | 'performance' | 'persuasion' | 'religion' | 'sleightOfHand' | 'stealth' | 'survival';

export type Improvement =
  | { kind: 'ability'; increases: Partial<Scores> }
  | { kind: 'feat'; name: string; source: string; description: string };
export interface Advancement {
  level: number;
  hitDieResult: number;
  improvement?: Improvement;
}
export interface Item {
  id: string;
  name: string;
  quantity: number;
  weightKg: number;
  equipped: boolean;
  attuned?: boolean | null;
  source: string;
  description: string;
}
export interface MountTrait {
  id: string;
  name: string;
  description: string;
}
export interface MountRecord {
  id: 'warhorse';
  name: string;
  species: 'Cavalo de Guerra';
  size: 'Grande';
  creatureType: 'Besta';
  hpMax: number;
  hitDice: { count: number; die: 'd10' };
  baseArmorClass: number;
  speedMeters: number;
  abilities: Scores;
  armor: {
    id: 'splint-barding';
    name: string;
    armorClass: number;
    strengthRequirement: number;
    stealthDisadvantage: boolean;
    weightKg: number;
    equipped: boolean;
    source: string;
  };
  attack: {
    name: string;
    toHit: number;
    reachMeters: number;
    damage: string;
    damageType: string;
  };
  traits: MountTrait[];
  source: string;
}
export interface PercivalRecord {
  schemaVersion: 1;
  id: 'percival';
  name: string;
  class: 'paladin';
  race: 'variant-human';
  background: 'soldier';
  baseline: { level: 6; hpMax: 64; abilities: Scores };
  xp: number;
  progressionMode: 'dm-confirmed';
  diceMode: 'physical-only';
  advancements: Advancement[];
  creation: {
    feat: 'polearm-master';
    racialAbilityBonuses: [Ability, Ability] | null;
    extraHumanSkill: Skill | null;
    extraLanguage: string | null;
    gamingSet: string | null;
    level4Improvement: { cha: 2 };
  };
  proficientSkills: Skill[];
  fightingStyle: 'great-weapon-fighting';
  equipment: Item[];
  coins: { gp: number; sp: number; cp: number };
  preparedSpellIds: string[];
  additionalSpellAccess: Record<string, boolean | null>;
  oath: {
    id: 'blood';
    spellList: 'vengeance';
    homebrewText: { absorbVitality: string; bloodBlessing: string };
    futureFeatures: Partial<Record<7 | 15 | 20, { name: string; description: string; source: string }>>;
  };
  mount: MountRecord;
  notes: string;
}

/** Somente contexto de cálculo, não um estado de sessão salvo. */
export interface CalculationContext {
  conscious?: boolean;
  bloodBlessingActive?: boolean;
  bloodVeilActive?: boolean;
}
