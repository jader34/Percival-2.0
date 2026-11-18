export interface SpellDetail {
  action: string;
  concentration: boolean;
  range: string;
  summary: string;
}
/** Referências curtas, sem DC fixa. As regras completas ficam no livro local. */
export const SPELL_DETAILS: Record<string, SpellDetail> = {
  bless: {
    action: "Ação",
    concentration: true,
    range: "9 m",
    summary:
      "Até três criaturas somam 1d4 às jogadas de ataque e salvaguardas. Concentração por até 1 minuto.",
  },
  command: {
    action: "Ação",
    concentration: false,
    range: "18 m",
    summary:
      "Dê uma ordem de uma palavra. O alvo faz salvaguarda de Sabedoria; consulte no livro as condições e limitações da ordem.",
  },
  "cure-wounds": {
    action: "Ação",
    concentration: false,
    range: "Toque",
    summary:
      "Cura 1d8 + seu modificador de Carisma; +1d8 por círculo acima do 1º. Role fisicamente e registre a cura.",
  },
  "thunderous-smite": {
    action: "Ação bônus",
    concentration: true,
    range: "Pessoal",
    summary:
      "O próximo acerto corpo-a-corpo com arma causa +2d6 trovejante. Salvaguarda de Força evita empurrão de 3 m e ficar caído. Até 1 minuto.",
  },
  "shield-of-faith": {
    action: "Ação bônus",
    concentration: true,
    range: "18 m",
    summary:
      "+2 CA para a criatura escolhida, por até 10 minutos. Nesta versão, a CA desse alvo é acompanhada na mesa; este registro controla espaço e concentração.",
  },
  "lesser-restoration": {
    action: "Ação",
    concentration: false,
    range: "Toque",
    summary:
      "Encerra uma doença ou uma condição: cego, surdo, paralisado ou envenenado.",
  },
  bane: {
    action: "Ação",
    concentration: true,
    range: "9 m",
    summary:
      "Até três criaturas fazem salvaguarda de Carisma. Em falha, subtraem 1d4 dos ataques e salvaguardas; até 1 minuto.",
  },
  "hunters-mark": {
    action: "Ação bônus",
    concentration: true,
    range: "27 m",
    summary:
      "Marque uma criatura; seus acertos com arma contra ela causam +1d6. Controle alvo e dano na mesa. Até 1 hora no círculo inicial.",
  },
  "hold-person": {
    action: "Ação",
    concentration: true,
    range: "18 m",
    summary:
      "Humanoide faz salvaguarda de Sabedoria ou fica paralisado; repete ao fim dos turnos. Ataques que acertem de até 1,5 m são críticos. Até 1 minuto.",
  },
  "misty-step": {
    action: "Ação bônus",
    concentration: false,
    range: "Pessoal",
    summary: "Teleporte-se até 9 m para um espaço desocupado que possa ver.",
  },
  "find-steed": {
    action: "10 minutos",
    concentration: false,
    range: "9 m",
    summary:
      "Convoca o Pesadelo Sanguinário (Cavalo de Guerra) com todos os 19 PV restaurados, Inteligência 6 e vínculo telepático a até 1,6 km.",
  },
  "warding-bond": {
    action: "Ação",
    concentration: false,
    range: "Toque",
    summary:
      "Concessão adicional da mesa. Consulte a regra aprovada e os componentes; o vínculo deve ser acompanhado manualmente.",
  },
};
