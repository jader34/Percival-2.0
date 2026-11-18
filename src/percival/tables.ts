/** PHB p.15: índice = nível; a posição zero não representa um nível. */
export const XP_THRESHOLDS = [0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000,
  64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

/** PHB impresso p.109: índice = nível de paladino; colunas = círculos 1 a 5. */
export const SPELL_SLOTS: readonly (readonly number[])[] = [
  [0,0,0,0,0],
  [0,0,0,0,0], [2,0,0,0,0], [3,0,0,0,0], [3,0,0,0,0], [4,2,0,0,0],
  [4,2,0,0,0], [4,3,0,0,0], [4,3,0,0,0], [4,3,2,0,0], [4,3,2,0,0],
  [4,3,3,0,0], [4,3,3,0,0], [4,3,3,1,0], [4,3,3,1,0], [4,3,3,2,0],
  [4,3,3,2,0], [4,3,3,3,1], [4,3,3,3,1], [4,3,3,3,2], [4,3,3,3,2],
];

/** PHB p.214. Somente nomes e níveis; descrições completas permanecem no livro. */
const PALADIN_BY_LEVEL: Record<number, [string, string][]> = {
  1: [
    ['divine-favor', 'Auxílio Divino'], ['bless', 'Bênção'], ['command', 'Comando'],
    ['cure-wounds', 'Curar Ferimentos'], ['wrathful-smite', 'Destruição Colérica'],
    ['searing-smite', 'Destruição Lancinante'], ['thunderous-smite', 'Destruição Trovejante'],
    ['detect-evil-and-good', 'Detectar o Bem e Mal'], ['detect-magic', 'Detectar Magia'],
    ['detect-poison-and-disease', 'Detectar Veneno e Doença'], ['compelled-duel', 'Duelo Compelido'],
    ['shield-of-faith', 'Escudo da Fé'], ['heroism', 'Heroísmo'],
    ['protection-from-evil-and-good', 'Proteção contra o Bem e Mal'], ['purify-food-and-drink', 'Purificar Alimentos'],
  ],
  2: [
    ['aid', 'Ajuda'], ['magic-weapon', 'Arma Mágica'], ['find-steed', 'Convocar Montaria'],
    ['locate-object', 'Localizar Objeto'], ['branding-smite', 'Marca da Punição'],
    ['protection-from-poison', 'Proteção contra Veneno'], ['lesser-restoration', 'Restauração Menor'],
    ['zone-of-truth', 'Zona da Verdade'],
  ],
  3: [
    ['elemental-weapon', 'Arma Elemental'], ['aura-of-vitality', 'Aura de Vitalidade'],
    ['magic-circle', 'Círculo Mágico'], ['create-food-and-water', 'Criar Alimentos'],
    ['blinding-smite', 'Destruição Cegante'], ['dispel-magic', 'Dissipar Magia'], ['daylight', 'Luz do Dia'],
    ['crusaders-mantle', 'Manto do Cruzado'], ['remove-curse', 'Remover Maldição'], ['revivify', 'Revivificar'],
  ],
  4: [
    ['aura-of-purity', 'Aura de Pureza'], ['aura-of-life', 'Aura de Vida'], ['banishment', 'Banimento'],
    ['staggering-smite', 'Destruição Estonteante'], ['locate-creature', 'Localizar Criatura'],
    ['death-ward', 'Proteção contra a Morte'],
  ],
  5: [
    ['circle-of-power', 'Círculo de Poder'], ['banishing-smite', 'Destruição Banidora'],
    ['dispel-evil-and-good', 'Dissipar o Bem e Mal'], ['geas', 'Missão'],
    ['destructive-wave', 'Onda Destrutiva'], ['raise-dead', 'Reviver os Mortos'],
  ],
};
export interface SpellEntry { id: string; name: string; level: number; source: string }
export const PALADIN_SPELLS: SpellEntry[] = Object.entries(PALADIN_BY_LEVEL).flatMap(([level, list]) =>
  list.map(([id, name]) => ({ id, name, level: Number(level), source: 'PHB:214' })));

/** PHB p.114. O mestre confirmou APENAS esta lista para o Juramento de Sangue. */
export const OATH_SPELLS: (SpellEntry & { paladinLevel: number })[] = [
  { id: 'bane', name: 'Perdição', level: 1, paladinLevel: 3, source: 'PHB:114' },
  { id: 'hunters-mark', name: 'Marca do Caçador', level: 1, paladinLevel: 3, source: 'PHB:114' },
  { id: 'hold-person', name: 'Imobilizar Pessoa', level: 2, paladinLevel: 5, source: 'PHB:114' },
  { id: 'misty-step', name: 'Passo Nebuloso', level: 2, paladinLevel: 5, source: 'PHB:114' },
  { id: 'haste', name: 'Velocidade', level: 3, paladinLevel: 9, source: 'PHB:114' },
  { id: 'protection-from-energy', name: 'Proteção contra Energia', level: 3, paladinLevel: 9, source: 'PHB:114' },
  { id: 'banishment', name: 'Banimento', level: 4, paladinLevel: 13, source: 'PHB:114' },
  { id: 'dimension-door', name: 'Porta Dimensional', level: 4, paladinLevel: 13, source: 'PHB:114' },
  { id: 'hold-monster', name: 'Imobilizar Monstro', level: 5, paladinLevel: 17, source: 'PHB:114' },
  { id: 'scrying', name: 'Vidência', level: 5, paladinLevel: 17, source: 'PHB:114' },
];

/** Não concedidas pelo PHB local ao paladino: acesso depende de autorização explícita. */
export const LEGACY_EXTRA_SPELLS: SpellEntry[] = [
  { id: 'warding-bond', name: 'Vínculo Protetor', level: 2, source: 'LEGACY:additional-access-unconfirmed' },
  { id: 'prayer-of-healing', name: 'Oração Curativa', level: 2, source: 'LEGACY:additional-access-unconfirmed' },
  { id: 'gentle-repose', name: 'Repouso Tranquilo', level: 2, source: 'LEGACY:additional-access-unconfirmed' },
];
