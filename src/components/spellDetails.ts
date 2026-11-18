export interface SpellDetail {
  action: string;
  concentration: boolean;
  range: string;
  duration: string;
  summary: string;
}

/** Resumos operacionais próprios para consulta rápida em mesa (sem reproduzir o texto literal do livro). */
export const SPELL_DETAILS: Record<string, SpellDetail> = {
  // 1º círculo — Paladino
  "divine-favor": {
    action: "Ação bônus",
    concentration: true,
    range: "Pessoal",
    duration: "Até 1 min",
    summary:
      "Seus acertos de ataque com arma causam +1d4 de dano radiante enquanto durar o efeito.",
  },
  bless: {
    action: "Ação",
    concentration: true,
    range: "9 m",
    duration: "Até 1 min",
    summary:
      "Até três criaturas somam 1d4 às jogadas de ataque e salvaguardas (+1 criatura por círculo acima do 1º).",
  },
  command: {
    action: "Ação",
    concentration: false,
    range: "18 m",
    duration: "1 rodada",
    summary:
      "Ordem de uma palavra a uma criatura que compreenda você; salvaguarda de Sabedoria evita obedecer no próximo turno (+1 alvo por círculo acima).",
  },
  "cure-wounds": {
    action: "Ação",
    concentration: false,
    range: "Toque",
    duration: "Instantânea",
    summary:
      "Restaura 1d8 + seu modificador de Carisma em uma criatura viva (+1d8 por círculo acima do 1º). Role fisicamente e registre a cura.",
  },
  "wrathful-smite": {
    action: "Ação bônus",
    concentration: true,
    range: "Pessoal",
    duration: "Até 1 min",
    summary:
      "O próximo acerto corpo-a-corpo com arma causa +1d6 psíquico; salvaguarda de Sabedoria ou o alvo fica amedrontado (usa ação para testar Sabedoria e encerrar).",
  },
  "searing-smite": {
    action: "Ação bônus",
    concentration: true,
    range: "Pessoal",
    duration: "Até 1 min",
    summary:
      "O próximo acerto corpo-a-corpo com arma soma +1d6 ígneo (+1d6 por círculo acima) e incendeia o alvo em 1d6 por turno até passar em Constituição ou apagar as chamas.",
  },
  "thunderous-smite": {
    action: "Ação bônus",
    concentration: true,
    range: "Pessoal",
    duration: "Até 1 min",
    summary:
      "O próximo acerto corpo-a-corpo com arma causa +2d6 trovejante; salvaguarda de Força evita empurrão de 3 m e ficar caído.",
  },
  "detect-evil-and-good": {
    action: "Ação",
    concentration: true,
    range: "Pessoal (9 m)",
    duration: "Até 10 min",
    summary:
      "Percebe presença e posição de aberrações, celestiais, corruptores, elementais, fadas, mortos-vivos e áreas consagradas ou profanadas a até 9 m.",
  },
  "detect-magic": {
    action: "Ação",
    concentration: true,
    range: "Pessoal (9 m)",
    duration: "Até 10 min",
    summary:
      "Sente efeitos mágicos a até 9 m; com uma ação, enxerga a aura em criatura ou objeto visível e identifica a escola de magia.",
  },
  "detect-poison-and-disease": {
    action: "Ação",
    concentration: true,
    range: "Pessoal (9 m)",
    duration: "Até 10 min",
    summary:
      "Identifica presença, direção e tipo de venenos, criaturas peçonhentas e doenças em um raio de 9 m.",
  },
  "compelled-duel": {
    action: "Ação bônus",
    concentration: true,
    range: "9 m",
    duration: "Até 1 min",
    summary:
      "Salvaguarda de Sabedoria; em falha, o alvo tem desvantagem ao atacar outros e precisa passar em Sabedoria para afastar-se além de 9 m de você.",
  },
  "shield-of-faith": {
    action: "Ação bônus",
    concentration: true,
    range: "18 m",
    duration: "Até 10 min",
    summary:
      "Concede +2 na CA de uma criatura visível no alcance. Acompanhe o bônus de CA do alvo na mesa.",
  },
  heroism: {
    action: "Ação",
    concentration: true,
    range: "Toque",
    duration: "Até 1 min",
    summary:
      "Criatura voluntária fica imune à condição amedrontado e recebe PV temporários iguais ao seu modificador de Carisma no início de cada turno dela (+1 alvo por círculo acima).",
  },
  "protection-from-evil-and-good": {
    action: "Ação",
    concentration: true,
    range: "Toque",
    duration: "Até 10 min",
    summary:
      "Aberrações, celestiais, corruptores, elementais, fadas e mortos-vivos têm desvantagem contra o alvo, que não pode ser enfeitiçado, amedrontado ou possuído por eles.",
  },
  "purify-food-and-drink": {
    action: "Ação",
    concentration: false,
    range: "3 m",
    duration: "Instantânea",
    summary:
      "Elimina venenos e doenças de alimentos e bebidas não mágicos contidos em uma esfera de 1,5 m de raio.",
  },

  // 2º círculo — Paladino
  aid: {
    action: "Ação",
    concentration: false,
    range: "9 m",
    duration: "8 horas",
    summary:
      "Até três criaturas aumentam seus PV máximos e atuais em 5 pela duração (+5 PV por círculo acima do 2º).",
  },
  "magic-weapon": {
    action: "Ação bônus",
    concentration: true,
    range: "Toque",
    duration: "Até 1 hora",
    summary:
      "Uma arma comum torna-se mágica com +1 em ataque e dano (+2 se conjurada com espaço de 4º círculo ou maior).",
  },
  "find-steed": {
    action: "10 minutos",
    concentration: false,
    range: "9 m",
    duration: "Instantânea",
    summary:
      "Convoca o Pesadelo Sanguinário (Cavalo de Guerra) com todos os 19 PV restaurados, Inteligência 6 e vínculo telepático a até 1,6 km.",
  },
  "locate-object": {
    action: "Ação",
    concentration: true,
    range: "Pessoal (300 m)",
    duration: "Até 10 min",
    summary:
      "Indica a direção de um objeto específico conhecido ou do exemplar mais próximo de um tipo em até 300 m (bloqueado por chumbo).",
  },
  "branding-smite": {
    action: "Ação bônus",
    concentration: true,
    range: "Pessoal",
    duration: "Até 1 min",
    summary:
      "O próximo acerto com arma soma +2d6 radiante (+1d6 por círculo acima), revela alvo invisível e impede invisibilidade com penumbra de 1,5 m.",
  },
  "protection-from-poison": {
    action: "Ação",
    concentration: false,
    range: "Toque",
    duration: "1 hora",
    summary:
      "Neutraliza um veneno no alvo e concede vantagem em salvaguardas contra envenenamento e resistência a dano de veneno.",
  },
  "lesser-restoration": {
    action: "Ação",
    concentration: false,
    range: "Toque",
    duration: "Instantânea",
    summary:
      "Encerra uma doença ou uma condição entre cego, surdo, paralisado ou envenenado em uma criatura tocada.",
  },
  "zone-of-truth": {
    action: "Ação",
    concentration: false,
    range: "18 m",
    duration: "10 min",
    summary:
      "Esfera de 4,5 m de raio exige salvaguarda de Carisma; quem falha não pode proferir mentira deliberada dentro da área (você sabe quem passou ou falhou).",
  },

  // 3º círculo — Paladino
  "elemental-weapon": {
    action: "Ação",
    concentration: true,
    range: "Toque",
    duration: "Até 1 hora",
    summary:
      "Arma comum passa a ser mágica com +1 no ataque e +1d4 de ácido, frio, fogo, elétrico ou trovejante (+2 e +2d4 no 5º círculo).",
  },
  "aura-of-vitality": {
    action: "Ação",
    concentration: true,
    range: "Pessoal (9 m)",
    duration: "Até 1 min",
    summary:
      "Com uma ação bônus em cada turno seu, restaura 2d6 PV em uma criatura à sua escolha dentro da aura de 9 m.",
  },
  "magic-circle": {
    action: "1 minuto",
    concentration: false,
    range: "3 m",
    duration: "1 hora",
    summary:
      "Cilindro de 3 m de raio barra entrada (ou saída, no modo reverso) e impõe desvantagem a celestiais, corruptores, elementais, fadas ou mortos-vivos; consome material de 100 PO.",
  },
  "create-food-and-water": {
    action: "Ação",
    concentration: false,
    range: "9 m",
    duration: "Instantânea",
    summary:
      "Produz comida nutritiva e água limpa suficientes para alimentar até 15 humanoides ou 5 montarias por 24 horas.",
  },
  "blinding-smite": {
    action: "Ação bônus",
    concentration: true,
    range: "Pessoal",
    duration: "Até 1 min",
    summary:
      "O próximo acerto corpo-a-corpo com arma causa +3d8 radiante; salvaguarda de Constituição ou o alvo fica cego, repetindo o teste ao fim dos turnos dele.",
  },
  "dispel-magic": {
    action: "Ação",
    concentration: false,
    range: "36 m",
    duration: "Instantânea",
    summary:
      "Encerra magias de até 3º círculo no alvo (ou círculo do espaço gasto); para magias maiores, teste de Carisma contra CD 10 + círculo da magia.",
  },
  daylight: {
    action: "Ação",
    concentration: false,
    range: "18 m",
    duration: "1 hora",
    summary:
      "Esfera projeta luz plena em 18 m de raio e penumbra por mais 18 m, dissipando escuridão mágica de 3º círculo ou inferior.",
  },
  "crusaders-mantle": {
    action: "Ação",
    concentration: true,
    range: "Pessoal (9 m)",
    duration: "Até 1 min",
    summary:
      "Você e criaturas amigáveis a até 9 m somam +1d4 de dano radiante aos acertos de ataque com arma.",
  },
  "remove-curse": {
    action: "Ação",
    concentration: false,
    range: "Toque",
    duration: "Instantânea",
    summary:
      "Encerra todas as maldições ativas sobre uma criatura ou quebra a sintonização forçada com um item mágico amaldiçoado.",
  },
  revivify: {
    action: "Ação",
    concentration: false,
    range: "Toque",
    duration: "Instantânea",
    summary:
      "Restaura à vida com 1 PV uma criatura morta há no máximo 1 minuto (não repõe membros nem cura velhice); consome diamantes de 300 PO.",
  },

  // 4º círculo — Paladino (e Juramento: Banimento)
  "aura-of-purity": {
    action: "Ação",
    concentration: true,
    range: "Pessoal (9 m)",
    duration: "Até 10 min",
    summary:
      "Criaturas amigáveis a até 9 m não adoecem, têm resistência a veneno e vantagem em salvaguardas contra cegueira, charme, surdez, medo, paralisia, veneno e atordoamento.",
  },
  "aura-of-life": {
    action: "Ação",
    concentration: true,
    range: "Pessoal (9 m)",
    duration: "Até 10 min",
    summary:
      "Aliados na aura têm resistência a necrótico, seus PV máximos não diminuem e quem inicia o turno com 0 PV (vivo) recupera 1 PV.",
  },
  banishment: {
    action: "Ação",
    concentration: true,
    range: "18 m",
    duration: "Até 1 min",
    summary:
      "Salvaguarda de Carisma ou o alvo é enviado a um semiplano inofensivo (ou a seu plano natal, podendo não retornar se mantido por 1 min; +1 alvo no 5º círculo).",
  },
  "staggering-smite": {
    action: "Ação bônus",
    concentration: true,
    range: "Pessoal",
    duration: "Até 1 min",
    summary:
      "O próximo acerto corpo-a-corpo com arma soma +4d6 psíquico; salvaguarda de Sabedoria ou sofre desvantagem em ataques e testes e perde reações até o fim do próximo turno dele.",
  },
  "locate-creature": {
    action: "Ação",
    concentration: true,
    range: "Pessoal (300 m)",
    duration: "Até 1 hora",
    summary:
      "Indica direção e deslocamento de criatura conhecida ou da mais próxima de espécie vista de perto em até 300 m (bloqueado por água corrente).",
  },
  "death-ward": {
    action: "Ação",
    concentration: false,
    range: "Toque",
    duration: "8 horas",
    summary:
      "Na primeira vez em que o alvo cairia a 0 PV por dano, permanece com 1 PV (ou nega um efeito de morte imediata sem dano), encerrando a proteção.",
  },

  // 5º círculo — Paladino
  "circle-of-power": {
    action: "Ação",
    concentration: true,
    range: "Pessoal (9 m)",
    duration: "Até 10 min",
    summary:
      "Aliados a até 9 m ganham vantagem em salvaguardas contra magias/efeitos mágicos e não sofrem dano ao passar em salvaguardas que causariam metade.",
  },
  "banishing-smite": {
    action: "Ação bônus",
    concentration: true,
    range: "Pessoal",
    duration: "Até 1 min",
    summary:
      "O próximo acerto com arma soma +5d10 de energia; se deixar o alvo com 50 PV ou menos, também o bane até o fim da concentração.",
  },
  "dispel-evil-and-good": {
    action: "Ação",
    concentration: true,
    range: "Pessoal",
    duration: "Até 1 min",
    summary:
      "Celestiais, corruptores, elementais, fadas e mortos-vivos atacam você com desvantagem; permite usar ação para encerrar charme/medo/possessão ou forçar retorno planar.",
  },
  geas: {
    action: "1 minuto",
    concentration: false,
    range: "18 m",
    duration: "30 dias",
    summary:
      "Salvaguarda de Sabedoria ou o alvo fica enfeitiçado sob uma ordem sua; desobedecê-la causa 5d10 psíquico até uma vez por dia.",
  },
  "destructive-wave": {
    action: "Ação",
    concentration: false,
    range: "Pessoal (9 m)",
    duration: "Instantânea",
    summary:
      "Criaturas escolhidas a até 9 m fazem salvaguarda de Constituição: falha causa 5d6 trovejante + 5d6 radiante (ou necrótico) e derruba; sucesso causa metade sem derrubar.",
  },
  "raise-dead": {
    action: "1 hora",
    concentration: false,
    range: "Toque",
    duration: "Instantânea",
    summary:
      "Devolve à vida com 1 PV criatura morta há até 10 dias (-4 temporário em d20, reduzindo 1 por descanso longo); consome diamante de 500 PO.",
  },

  // Magias exclusivas do Juramento (lista de Vingança)
  bane: {
    action: "Ação",
    concentration: true,
    range: "9 m",
    duration: "Até 1 min",
    summary:
      "Até três criaturas fazem salvaguarda de Carisma; em falha, subtraem 1d4 dos ataques e salvaguardas (+1 alvo por círculo acima do 1º).",
  },
  "hunters-mark": {
    action: "Ação bônus",
    concentration: true,
    range: "27 m",
    duration: "Até 1 hora",
    summary:
      "Marca um alvo visível: seus acertos com arma contra ele causam +1d6 e você tem vantagem em Percepção/Sobrevivência para rastreá-lo; se cair a 0 PV, mova com ação bônus.",
  },
  "hold-person": {
    action: "Ação",
    concentration: true,
    range: "18 m",
    duration: "Até 1 min",
    summary:
      "Humanoide faz salvaguarda de Sabedoria ou fica paralisado, repetindo o teste ao fim dos turnos (+1 humanoide por círculo acima do 2º).",
  },
  "misty-step": {
    action: "Ação bônus",
    concentration: false,
    range: "Pessoal",
    duration: "Instantânea",
    summary:
      "Teleporta-se até 9 m para um espaço desocupado que você consiga ver.",
  },
  haste: {
    action: "Ação",
    concentration: true,
    range: "9 m",
    duration: "Até 1 min",
    summary:
      "Dobra deslocamento, soma +2 na CA, vantagem em salvaguardas de Destreza e +1 ação restrita por turno; ao encerrar, o alvo perde 1 turno por letargia.",
  },
  "protection-from-energy": {
    action: "Ação",
    concentration: true,
    range: "Toque",
    duration: "Até 1 hora",
    summary:
      "Criatura voluntária tocada recebe resistência a um tipo escolhido: ácido, frio, fogo, elétrico ou trovejante.",
  },
  "dimension-door": {
    action: "Ação",
    concentration: false,
    range: "150 m",
    duration: "Instantânea",
    summary:
      "Teleporta você (e opcionalmente uma criatura voluntária de tamanho igual ou menor adjacente) para qualquer ponto dentro de 150 m.",
  },
  "hold-monster": {
    action: "Ação",
    concentration: true,
    range: "27 m",
    duration: "Até 1 min",
    summary:
      "Criatura (exceto morto-vivo) faz salvaguarda de Sabedoria ou fica paralisada, repetindo o teste ao fim de cada turno dela.",
  },
  scrying: {
    action: "10 minutos",
    concentration: true,
    range: "Pessoal",
    duration: "Até 10 min",
    summary:
      "Observa e escuta à distância uma criatura no mesmo plano (salvaguarda de Sabedoria ajustada pela familiaridade) ou local já visto; exige foco de 1.000 PO.",
  },

  // Magias de acesso adicional sujeito à confirmação da mesa
  "warding-bond": {
    action: "Ação",
    concentration: false,
    range: "Toque",
    duration: "1 hora",
    summary:
      "Concessão da mesa: aliado voluntário a até 18 m recebe +1 na CA e salvaguardas e resistência a todo dano, mas você sofre o mesmo valor de dano a cada vez.",
  },
  "prayer-of-healing": {
    action: "10 minutos",
    concentration: false,
    range: "9 m",
    duration: "Instantânea",
    summary:
      "Concessão da mesa: fora de combate, até seis criaturas visíveis recuperam 2d8 + seu modificador de Carisma (+1d8 por círculo acima do 2º).",
  },
  "gentle-repose": {
    action: "Ação",
    concentration: false,
    range: "Toque",
    duration: "10 dias",
    summary:
      "Concessão da mesa: preserva um cadáver contra decomposição e mortos-vivos, congelando o tempo limite para magias de ressurreição.",
  },
};
