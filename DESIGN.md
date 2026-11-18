---
name: Percival — Relicário de sangue
description: Hematita, rubro, marfim e ouro em uma ficha de sessão exclusiva de Percival.
colors:
  ground: "#160e12"
  surface: "#21171c"
  surface-hover: "#35242c"
  text: "#efe3d8"
  muted: "#b7a2aa"
  gold: "#c9ab87"
  rose: "#f0b1bb"
  red: "#94283d"
  red-light: "#ca6378"
  line: "#38242e"
  line-strong: "#65424f"
typography:
  display:
    fontFamily: '"Cinzel", Georgia, serif'
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  headline:
    fontFamily: '"Cinzel", Georgia, serif'
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.4
  title:
    fontFamily: '"Barlow", sans-serif'
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: '"Barlow", sans-serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: '"Barlow", sans-serif'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: '"Barlow", sans-serif'
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.5
  vitality-number:
    fontFamily: '"Barlow", sans-serif'
    fontSize: "76px"
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-0.05em"
rounded:
  "3": "3px"
  "4": "4px"
  "5": "5px"
  "8": "8px"
  "10": "10px"
spacing:
  "4": "4px"
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "20": "20px"
  "24": "24px"
  "28": "28px"
  "32": "32px"
components:
  button-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.5}"
    padding: "12px 18px"
  button-default-hover:
    backgroundColor: "{colors.surface-hover}"
  button-primary:
    backgroundColor: "{colors.red}"
    textColor: "#fff2eb"
    typography: "{typography.button}"
    rounded: "{rounded.5}"
    padding: "12px 18px"
  button-primary-hover:
    backgroundColor: "#a72c42"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.5}"
    padding: "12px 18px"
  button-damage:
    backgroundColor: "#9f293e"
    textColor: "#fff2ed"
    typography: "{typography.button}"
    rounded: "{rounded.5}"
    padding: "12px 18px"
  button-damage-hover:
    backgroundColor: "#b3364d"
  button-heal:
    backgroundColor: "#e7d8c6"
    textColor: "#32191d"
    typography: "{typography.button}"
    rounded: "{rounded.5}"
    padding: "12px 18px"
  button-heal-hover:
    backgroundColor: "#fff0da"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    padding: "4px 0"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.5}"
  search-field:
    textColor: "{colors.muted}"
    rounded: "{rounded.5}"
    padding: "0 12px"
  navigation:
    backgroundColor: "#1b1217"
    padding: "0 10px env(safe-area-inset-bottom)"
  effect-chip:
    backgroundColor: "#30161d"
    textColor: "{colors.rose}"
    rounded: "{rounded.4}"
    padding: "8px 10px"
  ability-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.4}"
    padding: "15px 8px"
  vitality:
    textColor: "{colors.text}"
    rounded: "{rounded.8}"
    padding: "20px"
---

# Design System: Percival — Relicário de sangue

## Overview

**Creative North Star: "Relicário de sangue"**

Hematita escura, sangue rubro, texto marfim e metal dourado dão identidade a uma ferramenta de mesa, não a uma apresentação promocional. Linhas finas gravadas, cantos discretos e títulos lapidares cercam controles diretos. A personalidade está no material e no detalhe; números e ações continuam sendo o primeiro plano.

O relicário é uma gota vetorial com líquido que acompanha os pontos de vida. Ele complementa, sem substituir, o valor numérico e a descrição do estado. O sistema mantém densidade de consulta e operação por toque: texto secundário recua, ações relevantes contrastam e descrições extensas ficam em expansões ou diálogos.

**Key Characteristics:**
- Fundo hematítico, marfim legível, rubro operacional e ouro pontual.
- Cinzel para identidade e títulos; Barlow para leitura, controles e números tabulares.
- Linhas e camadas tonais em vez de uma grade de cartões elevados.
- Símbolos vetoriais e movimento vinculado a mudanças de estado.
- Operação mobile-first, com navegação inferior e composição lateral no desktop.

Registro em modo scan de `src/tokens.css`, `src/styles.css`, `src/main.tsx`, `src/App.tsx` e componentes. A linguagem confirmada vem de `.impeccable/direction.md` e do contrato `seed 488b2326` em `index.html`; o modo da superfície permanece naquela direção. As capturas finais mobile e desktop de `.impeccable/review/` confirmam a composição. O frontmatter preserva os nomes das onze cores de `:root`; os papéis tipográficos e medidas de espaçamento/arredondamento catalogam declarações existentes, não novas variáveis CSS. Valores locais de componentes permanecem locais. Não há escala tonal implementada: o sidecar não inventa rampas.

## Colors

Uma paleta escura e quente separa estado, operação e ornamento sem recorrer a verde de cura ou azul de interface genérica.

### Primary
- **Rubro — `red`:** confirmações primárias, espaços de magia preenchidos e controles nativos de seleção.
- **Sangue iluminado — `red-light`:** bordas de seleção, destaque de navegação, ícones do juramento e cursor de texto.
- **Rosa claro — `rose`:** estado ativo, links, mensagens de erro, rótulos do juramento e realces legíveis sobre superfícies escuras.

### Secondary
- **Ouro envelhecido — `gold`:** identidade heráldica, ícones auxiliares, pequenos metadados e anel de foco. Não preenche indiscriminadamente os controles.

### Neutral
- **Hematita — `ground`:** fundo global e campos comuns.
- **Metal sombreado — `surface`:** botões padrão, atributos e diálogos.
- **Metal realçado — `surface-hover`:** hover do botão padrão.
- **Marfim — `text`:** leitura principal; **cinza rosado — `muted`:** apoio, descrições e estados inativos.
- **Gravura — `line`:** divisórias; **gravura reforçada — `line-strong`:** contornos de campos e controles.

Dano e cura têm tintas locais distintas no frontmatter: dano rubro com texto claro; cura marfim com texto escuro. O gradiente de Vitalidade e os gradientes metálico/sanguíneo do SVG pertencem à assinatura, não são cores globais nem justificam novos tokens.

**The Estado explícito Rule.** Cor acompanha texto, número ou estado semântico; sangue, seleção e erro não dependem apenas da cor.

## Typography

**Display Font:** Cinzel, Georgia, serif. **Body Font:** Barlow, sans-serif. As fontes são empacotadas localmente por `@fontsource`: Cinzel 600; Barlow 400, 500, 600 e 700. Não há fonte mono nem carregamento por CDN.

### Hierarchy
- **Display:** nome de Percival; base no frontmatter, reduzido a 29px até 359px, ampliado a 38px a partir de 600px e 43px a partir de 1000px.
- **Headline:** h2 geral; títulos de seção usam 17px, páginas de consulta 25px e Vitalidade 15px no celular / 18px a partir de 600px.
- **Title:** h3 operacional em Barlow; nome da arma é uma exceção em Cinzel, 18px.
- **Body:** corpo base do frontmatter; parágrafos limitados a 70ch. Descrições densas usam principalmente 12–14px.
- **Label:** rótulo de campo. Metadados e pequenos indicadores variam entre 9 e 12px; essa diferença existe no código, não é uma recomendação universal para novos controles.
- **Vitality number:** destaque numérico tabular; 68px até 359px, base no frontmatter, 88px a partir de 600px e 82px a partir de 1000px. Peso 500, distinto dos títulos 600.

PV, defesas, ataques, reservas, espaços, moedas, atributos e prévias numéricas usam `font-variant-numeric: tabular-nums`. Não há escala modular única ou tamanhos fluidos por `clamp()` implementados.

**The Número antes do ornamento Rule.** Use Cinzel para identidade e títulos, mantendo Barlow e algarismos tabulares na operação e na leitura de estado.

## Layout

- **Base mobile:** contêiner central com máximo de 1440px; corpo com padding `24px 20px 104px`. Uma coluna, cabeçalho compacto e barra de sessão. A sequência construída em Combate é Vitalidade, defesas, efeitos quando presentes, Smite, armas e juramento; reservas vêm depois.
- **Navegação mobile:** quatro destinos — Combate, Magias, Inventário e Ficha — fixos ao rodapé. Botões com altura mínima de 72px; área segura inferior via `env(safe-area-inset-bottom)`. O viewport declara `viewport-fit=cover`.
- **A partir de 600px:** corpo `32px 36px 110px`; selo junto ao nome, atributos em seis colunas em vez de três, lista de magias em três colunas e diálogos centralizados. Vitalidade ganha espaço e recipiente maior.
- **A partir de 1000px:** reserva esquerda de 210px; corpo `38px 42px 40px`; identidade em trilho fixo. Navegação lateral de 180px, topo 320px, margem esquerda -188px, com `left: auto`, `right: auto` e `bottom: auto`. Preservar explicitamente `right: auto`: evita herdar o esticamento da barra mobile. Botões laterais têm altura mínima de 52px.
- **Combate desktop:** `minmax(0, 1.5fr) minmax(250px, 1fr)` com gap 36px. Reservas recebem linha à esquerda e padding de 28px. Painéis de consulta têm máximo de 880px; inventário passa a duas colunas.
- **Até 359px:** corpo `18px 14px 100px`, tipografia e ornamento menores, ações de vida com padding lateral reduzido, indicação auxiliar “Usar” do Smite oculta. O conteúdo principal continua presente.

A cadência mistura gaps curtos (4–16px), padding de controles e linhas (12–24px) e separação entre grupos (28–32px). Não há uma escala abstrata adicional. O painel de vida usa duas colunas e seus botões ocupam a linha inteira na proporção `1.6fr 1fr`.

Diálogo: largura máxima de 540px, altura limitada ao viewport dinâmico, cabeçalho sticky, rolagem interna e contenção de overscroll. No mobile, corpo com padding inferior somado à área segura; a regra compacta até 359px substitui esse padding por 16px. Este registro descreve essa exceção, não afirma proteção de área segura em todos os tamanhos.

## Elevation & Depth

A interface é predominantemente plana: divisórias finas, contraste tonal e um campo rubro delimitam grupos. Vitalidade combina gradiente, moldura dupla e desenho metálico; não há blur de vidro, textura raster nem sombra em cada linha de recurso. As sombras implementadas são estruturais e restritas à barra inferior, ao diálogo e à mensagem flutuante.

### Shadow Vocabulary
- **Navegação inferior:** `0 -8px 28px #08050955`; removida no desktop.
- **Diálogo:** `0 -12px 70px #08050999`; backdrop `#080509cc` separa a operação modal.
- **Mensagem flutuante:** `0 8px 28px #0007`.

**The Plano por padrão Rule.** Organize leitura com linhas e camadas tonais; reserve sombra para superfícies que realmente se sobrepõem ao conteúdo.

Botões transicionam cor de fundo, borda e texto em 0.18s, com easing CSS padrão. O líquido transiciona `transform` em 0.7s com `cubic-bezier(0.16, 1, 0.3, 1)`. `prefers-reduced-motion: reduce` remove transições/animações e troca rolagem suave por automática. Não há movimento ambiente contínuo.

## Shapes

Contornos finos (normalmente 1px) e retângulos levemente arredondados sustentam o caráter gravado. Selo de nível e badge do juramento usam raio de 3px; atributos, efeitos e avisos usam 4px; botões comuns e campos usam 5px. Vitalidade usa 8px e uma moldura interna com 3px. Toast usa 6px; diálogo tem `12px 12px 0 0` no mobile e 10px a partir de 600px.

Os marcadores de espaços de magia são pequenos recipientes (14×18px), com raio `4px 4px 6px 6px` e inclinação `skewY(-7deg)`. O relicário é uma gota recortada, cercada por polígonos e uma haste heráldica; não transformar todos os componentes nessa silhueta. Círculos pequenos ficam em indicadores e proficiências, não em botões pill generalizados.

## Components

### Buttons

Controles diretos com peso visual proporcional à operação. Padrão, primário e secundário compartilham a geometria do frontmatter e altura **mínima** de 46px; a versão compacta tem mínimo de 44px, padding `8px 13px` e texto de 13px. Não confundir mínimo com altura fixa.

- **Padrão:** superfície escura e contorno reforçado; hover em superfície realçada.
- **Primário:** rubro com borda `red-light`; cor local de hover no frontmatter.
- **Secundário:** fundo transparente; preserva o hover herdado do padrão.
- **Dano / cura:** cores e textos contrastantes distintos, ícones de menos/mais e verbos explícitos. Não trocar cura por verde.
- **Texto:** operação discreta em `muted`, hover em `text`, mínimo de 44px; Desfazer e Descansar são exemplos.
- **Ícone:** alvo mínimo de 44×44px, fundo transparente, hover em `surface`, nome acessível explícito.
- **Estados comuns:** `:focus-visible` com outline dourado de 2px e offset de 4px; pressionado aplica `brightness(0.9)` quando habilitado; desabilitado usa opacidade 0.42 e cursor `not-allowed`.

Smite é uma linha destacada com ícone, verbo e explicação curta; juramento e reservas usam linhas separadas por borda. Elas não viram uma coleção de cartões elevados.

### Inputs / Fields

Campos usam fundo `ground`, texto `text`, contorno `line-strong`, raio de 5px, placeholder `muted` e caret `red-light`. Busca tem invólucro contornado com ícone SVG e input interno transparente com mínimo de 48px; seu foco tem offset zero. Select tem mínimo de 48px. Quantidade em diálogo usa 44px de fonte, números tabulares e mínimo de 82px. Checkbox/radio nativos medem 20px com acento rubro. Erros são texto rosa; não há variante global de borda de erro inventada.

### Navigation

Mobile: ícone sobre texto, seleção com borda superior `red-light`, texto `rose` e leve gradiente rubro. Desktop: ícone e texto em linha, seleção com superfície rubra escura e contorno. `aria-current="page"` identifica o destino; hover clareia o texto. Filtros Preparadas/Todas disponíveis usam `aria-pressed` e sublinhado, não a semântica de navegação principal.

### Chips / Cards / Lists

Efeitos ativos são botões retangulares rosados com ícone de encerramento, mínimo de 44px, borda e fundo locais; texto explica que tocar encerra. O badge “Juramento” é informativo, não um filtro. Atributos são pequenos cartões centrados, com modificador tabular grande e linha acima do valor do atributo em corpo menor. Magias e inventário são listas separadas por linhas; detalhes adicionais usam `details`/`summary` nativos. Resultado vazio oferece orientação textual.

### Vitalidade — assinatura

Painel rubro com moldura interna, PV atual/máximo, estado escrito, PV temporários e dois comandos explícitos. O SVG autoral em `BloodVessel.tsx` usa `viewBox="0 0 200 230"`, gradientes e clipPath; o nível é calculado por `190 - clamp(ratio, 0, 1) * 145`. É decorativo (`aria-hidden`): não é o único indicador. O selo em `public/sigil.svg` também é vetorial; os demais ícones operacionais vêm de Lucide em SVG, não são todos autorais. Não há retrato factual de Percival nem raster ilustrativo.

### Dialog / Feedback

`Modal.tsx` usa `<dialog>` nativo com `showModal()`, título associado, bloqueio de rolagem do body, Escape/fechar e restauração do foco ao elemento anterior. A aparência muda de folha inferior para janela centralizada a partir de 600px. Mensagens de operação ficam dentro do diálogo aberto; fora dele, toast usa `role="status"` ou `role="alert"`. Falhas de armazenamento também aparecem em aviso persistente. O estado diz “Salvo neste aparelho”, sem insinuar sincronização.

O link de salto aparece ao receber foco. Alguns controles secundários implementados têm mínimo de 36px (PV temporários e descrição de magia); não declarar um mínimo universal de 44px nem conformidade integral de acessibilidade a partir desta documentação.

## Do's and Don'ts

### Do:
- **Do** preservar os nomes e valores de `src/tokens.css`; manter tintas locais restritas aos componentes que já as usam.
- **Do** manter Barlow e números tabulares na operação, com Cinzel reservado à identidade e aos títulos.
- **Do** conservar texto, número e verbo explícito junto a estados, símbolos e cores.
- **Do** preservar foco visível, semântica nativa, movimento reduzido e comportamento responsivo existente.
- **Do** manter `right: auto` na navegação desktop e a barra inferior de quatro destinos no celular.
- **Do** usar SVG para o relicário e o selo, distinguindo esses desenhos autorais dos ícones Lucide.

### Don't:
- **Don't** inventar retrato de Percival, dados virtuais ou uma identidade genérica de gerenciador de personagens.
- **Don't** adicionar vidro com blur, ruído animado, cartões promocionais ou movimento ambiente.
- **Don't** substituir cura marfim por verde nem usar o rubro sozinho como indicação de estado.
- **Don't** promover cores locais, medidas observadas ou rampas sintetizadas a novos tokens do código sem implementação explícita.
- **Don't** afirmar sincronização, suporte offline, aprovação integral de acessibilidade ou testes em aparelhos físicos a partir deste registro visual.
