# Percival — ficha-base e evolução

> **Escopo:** ficha exclusiva de Percival, paladino nível 6. Todas as rolagens são físicas. Esta é a base de regras do novo projeto, não uma alteração da ficha em uso.
>
> **Fonte editável:** `src/percival/data.ts`. **Cálculos:** `src/percival/rules.ts`. Este documento registra o ponto de partida no nível 6; a consulta executável recalcula o registro atual. Não edite resultados derivados para subir de nível.

## 1. Identidade e decisões confirmadas

| Campo | Registro | Origem |
|---|---|---|
| Nome | Percival “O Triturador” | Cadastro antigo |
| Classe / nível inicial | Paladino 6 | Usuário + cadastro antigo |
| Raça | Humano variante | Usuário; livro p.31 |
| Antecedente | Soldado | Usuário; livro p.142 |
| Juramento | Sangue, homebrew do mestre | Texto enviado pelo usuário |
| Magias de juramento | Lista de Vingança, e somente a lista | Usuário; livro p.114 |
| Talento inicial | Mestre de Armas de Haste | Usuário; no livro p.170: “Maestria em Arma de Haste” |
| Escolha do nível 4 | +2 em Carisma, chegando a 18 | Usuário |
| Estilo de combate | Combate com Armas Grandes | Cadastro antigo; livro p.110 |
| PV máximos no nível 6 | 64, preservados | Usuário |
| Evolução dos PV | Informar o resultado físico de 1d10 por nível | Usuário; livro p.109 |
| XP atual confirmado | 18.967 | Informado pelo usuário (nível 6 → 23.000 no nível 7) |

Os atributos abaixo **já incluem** os bônus anteriores ao nível 6. Não somar novamente os bônus raciais, o talento inicial nem o +2 de Carisma do nível 4. A distribuição original dos dois +1 de humano variante ainda não foi informada.

## 2. Atributos e salvaguardas no nível 6

| Atributo | Valor | Modificador | Salvaguarda sem aura | Com sua Aura de Proteção |
|---|---:|---:|---:|---:|
| Força | 16 | +3 | +3 | +7 |
| Destreza | 10 | +0 | +0 | +4 |
| Constituição | 14 | +2 | +2 | +6 |
| Inteligência | 13 | +1 | +1 | +5 |
| Sabedoria | 12 | +1 | +4 | +8 |
| Carisma | 18 | +4 | +7 | +11 |

Proficiência: **+3**. Paladino é proficiente nas salvaguardas de Sabedoria e Carisma. A aura concede **+4**, inclusive ao próprio Percival, enquanto ele está consciente; não beneficia iniciativa ou perícias. Inconsciente, sua própria aura deixa de funcionar. Fontes: atributos do cadastro antigo; fórmulas do livro pp.15, 110–111 e 175.

### Perícias registradas

- Atletismo **+6**; Intimidação **+7**; Intuição **+4**; Persuasão **+7**.
- Percepção passiva **11**, enquanto Percepção não for escolhida como a perícia humana pendente.
- Iniciativa **+0**.
- O cadastro antigo tinha “Intuição” e “Perspicácia”. Esta base utiliza apenas **Intuição** para a perícia *Insight*, mantendo as 18 perícias do sistema.
- Há uma **perícia adicional de humano variante a identificar**. Ela não foi escolhida automaticamente nem substituída por uma proficiência já existente.

Proficiências de classe: todas as armaduras, escudos, armas simples e marciais. Soldado concede Atletismo, Intimidação, veículos terrestres e um tipo de kit de jogo; o kit específico está pendente. Idiomas: Comum e outro a identificar. Fontes: livro pp.31, 110 e 142.

## 3. Combate e recursos no nível 6

| Elemento | Valor de referência |
|---|---|
| PV máximos | **64**; PV atuais/temporários da sessão não foram importados |
| Dados de Vida | **6d10**; recuperação de até 3 dados gastos em descanso longo |
| CA com placas | **18**; sem bônus de Destreza nem de estilo Defesa |
| Deslocamento | **9 m**; Força 16 atende à exigência da armadura |
| Furtividade | Desvantagem pela armadura de placas |
| Alabarda | **+6** para atingir; **1d10 + 3** cortante; alcance **3 m** |
| Cabo da alabarda | **+6** para atingir; **1d4 + 3** concussão; ação bônus após a ação de Ataque elegível |
| Ataque Extra | **2 ataques** por ação de Ataque no próprio turno |
| Cura pelas Mãos | Reserva máxima de **30**; descanso longo |
| Sentido Divino | **5 usos**; descanso longo |
| Canalizar Divindade | **1 uso compartilhado**; descanso curto ou longo |
| Aura de Proteção | **+4** em salvaguardas; raio **3 m**; requer consciência |

O ataque com o cabo não é um terceiro ataque gratuito: disputa a ação bônus com magias e outros efeitos. Ataque Extra não duplica ataques de oportunidade. Fontes: livro pp.109–111, 147, 151, 170 e 188.

### Destruição Divina

Após um acerto corpo-a-corpo com arma:

- Espaço de 1º círculo: **2d8** radiante.
- Espaço de 2º círculo: **3d8** radiante.
- Mais **1d8** se o alvo for corruptor ou morto-vivo.
- Progressão futura: `min(círculo + 1, 5)d8`, antes do dado adicional pelo tipo do alvo.
- Em crítico, dobrar os dados de dano, não modificadores fixos. O helper informa os dados do Smite; não inclui o dano da arma nem o dado da Destruição Divina Aprimorada.

A partir do nível 11, Destruição Divina Aprimorada acrescenta **1d8 radiante** aos acertos corpo-a-corpo com arma, sem consumir espaço; é separada do teto do Smite comprado com espaço. Fontes: livro p.111; críticos e cobertura na p.198.

## 4. Juramento de Sangue

**O texto integral fornecido pelo usuário está preservado em `PERCIVAL.oath.homebrewText`. Ele prevalece sobre as descrições divergentes do cadastro antigo.**

### Absorver Vitalidade

- Ação, toque e um uso de Canalizar Divindade.
- Salvaguarda de Constituição contra a CD de magia de Percival.
- Em falha, a criatura fica **impedida** (*restrained*).
- Repete a salvaguarda ao final de cada turno dela; sucesso encerra o efeito.
- Nenhuma cura, dano ou duração máxima foi inventada: o texto fornecido não os estabelece.

### Bênção de Sangue

- Ação e um uso de **Canalizar Divindade**, compartilhado com Absorver Vitalidade.
- Dura **1 minuto**. Bônus nos ataques com a arma: Carisma, mínimo +1; atualmente **+4**, elevando o ataque da alabarda de +6 para **+10**.
- O primeiro acerto após imbuir a arma causa dano **radiante** e aplica a marca por um turno.
- Um ataque com essa arma contra alvo marcado causa dano radiante extra igual a Carisma, atualmente **+4**, e remove a marca.
- Se um oponente marcado morrer, o próximo acerto com a arma será radiante e marcará o novo alvo, conforme o texto do mestre.
- Luz escarlate **3 m**, mais **3 m** de penumbra; a arma passa a ser mágica durante o efeito se ainda não era.
- Termina voluntariamente, ao deixar de segurar/portar a arma ou ao ficar inconsciente.

**Limite deliberado:** o motor calcula os bônus, mas não simula turnos, não transfere marcas nem decide o momento exato de expiração de “1 turno”. Antes de automatizar esse fluxo, confirmar com o mestre a duração da marca, a resolução de morte no ataque que a consome e quais parcelas de dano são convertidas para radiante.

**Não foram concedidos** Abjurar Inimigo, Voto de Inimizade, Vingador Implacável, Alma de Vingança ou Anjo Vingador. Apenas as magias vêm de Vingança. As características homebrew dos níveis **7, 15 e 20** dependem do mestre.

## 5. Magias

Base no nível 6: **CD 15**, ataque mágico **+7**, **7 magias preparáveis**, além das **4 de juramento**. Espaços: **4 de 1º círculo e 2 de 2º círculo**. Fontes: livro pp.109–111 e 114.

### Seleção preservada do cadastro antigo

Preparação validada pelo livro local:

1. Bênção.
2. Comando.
3. Curar Ferimentos.
4. Destruição Trovejante.
5. Escudo da Fé.
6. Restauração Menor.

A sétima seleção registrada, **Vínculo Protetor**, foi preservada como pendente, pois não consta na lista de paladino deste livro. Não foi apagada nem substituída. Oração Curativa e Repouso Tranquilo também foram preservadas como acessos adicionais não confirmados. Caso a mesa conceda essas magias, registrar `true` na respectiva chave de `additionalSpellAccess`; o motor então permite prepará-las dentro da cota. Fonte: comparação entre cadastro antigo e livro p.214.

Sempre preparadas no nível 6, fora da cota: **Perdição, Marca do Caçador, Imobilizar Pessoa e Passo Nebuloso**. A lista completa de magias de paladino do livro está catalogada por círculo; novas opções ficam disponíveis quando surgem os espaços, mas **não são escolhidas automaticamente**.

Correção relevante para a interface futura: **Destruição Trovejante causa 2d6**, não o 1d6 presente no cadastro antigo; não confundir essa magia de concentração com Destruição Divina. Fonte: livro p.239.

## 6. Equipamento e regras fora do livro

O inventário importado está em `PERCIVAL.equipment`; moedas: **120 PO, 45 PP e 14 PC**, valores do cadastro padrão antigo, não confirmação do saldo atual da sessão.

- **Alabarda e placas:** pesos ajustados à tabela do PDF local: **3 kg** e **32,5 kg**, respectivamente; demais pesos importados não foram todos revalidados (livro pp.147 e 151).
- **Amuleto do Devoto +1:** regra preservada do cadastro antigo, não encontrada no livro local. Equipado **e sintonizado**, concede CD **16**, ataque mágico **+8** e uma utilização adicional de Canalizar Divindade sem consumir o uso da classe, recuperada **ao amanhecer**, não automaticamente em descanso longo. A sintonização está `null` até confirmação; por isso os resultados padrão usam CD 15 e ataque +7. O amuleto não adiciona +1 ao ataque da alabarda.
- **Manto do Véu de Sangue:** regra importada da mesa; ação bônus, um minuto, um uso por descanso longo; meia cobertura concede +2 CA e +2 nas salvaguardas de Destreza, incluindo aliados a 1,5 m. Ativo, Percival vai a **CA 20**; sua salvaguarda de Destreza com aura passa a **+6**. Não empilhar múltiplas meias coberturas.
- **Poções de Cura Maior:** duas no cadastro antigo, expressão importada **4d4 + 4**, sempre rolada na mesa.
- **Pesadelo Sanguinário (Cavalo de Guerra com Cota de talas):** confirmado pelo usuário. Besta Grande; **19 PV** (`3d10 + 3`), deslocamento **18 m**, atributos FOR 18 (+4), DES 12 (+1), CON 13 (+1), INT 2 (-4), SAB 12 (+1), CAR 7 (-2), Percepção passiva **11**. Equipada com barda de **Cota de talas** (**CA 17**, Força 15 atendida pela Força 18 do cavalo, desvantagem em Furtividade; sem armadura: CA 11). Ataque **Cascos**: **+6** para atingir, alcance 1,5 m, **2d6 + 4** de concussão; **Investida Atropeladora** após mover 6 m em linha reta (salvaguarda de Força **CD 14** ou fica caído; se caído, outro ataque de cascos com ação bônus). Fontes: livro pp.147, 157, 200 e 306.

Nenhum recurso atualmente gasto, efeito ativo, concentração, PV atual ou estado da montaria foi lido do Firebase. Esta etapa não importa o estado vivo da campanha e não o reinicializa.

## 7. Matemática e evolução

Fórmulas implementadas, com `floor` significando arredondar para baixo:

```text
modificador(A) = floor((A - 10) / 2)
proficiência = 2 + floor((nível - 1) / 4)
Cura pelas Mãos = 5 × nível
Sentido Divino = 1 + modificador(Carisma)
magias preparáveis = max(1, modificador(Carisma) + floor(nível / 2))
CD de magia = 8 + proficiência + modificador(Carisma) + bônus confirmado do amuleto
ataque mágico = proficiência + modificador(Carisma) + bônus confirmado do amuleto
ataque da alabarda = modificador(Força) + proficiência + Bênção de Sangue, se ativa
PV máximos = 64 - 6 × modificador(CON da base)
           + soma dos d10 físicos registrados após o nível 6
           + nível atual × modificador(CON atual)
```

A fórmula de PV preserva os **64** sem inventar as rolagens dos níveis anteriores e aplica Constituição retroativamente. Os aumentos de atributo futuros entram no histórico; a base do nível 6 não deve ser reescrita para evoluir. Fontes: livro pp.15, 109–111, 175 e 179.

| Nível alcançado | Atualizações importantes |
|---:|---|
| 7 | Espaços 4/3; nova característica de Sangue pendente do mestre |
| 8 | Escolher incremento de atributo ou talento; não escolher automaticamente |
| 9 | Proficiência +4; espaços 4/3/2; Velocidade e Proteção contra Energia sempre preparadas |
| 10 | Aura de Coragem |
| 11 | Destruição Divina Aprimorada; espaços 4/3/3 |
| 12 | Novo incremento ou talento |
| 13 | Proficiência +5; espaços 4/3/3/1; Banimento e Porta Dimensional sempre preparadas |
| 14 | Toque Purificador; usos iguais a Carisma, mínimo 1 |
| 15 | Espaços 4/3/3/2; nova característica de Sangue pendente do mestre |
| 16 | Novo incremento ou talento |
| 17 | Proficiência +6; espaços 4/3/3/3/1; Imobilizar Monstro e Vidência sempre preparadas |
| 18 | Auras de Proteção e Coragem passam a 9 m; o manto permanece em 1,5 m |
| 19 | Novo incremento ou talento; espaços 4/3/3/3/2 |
| 20 | Nova característica de Sangue pendente do mestre |

Fonte da progressão: livro pp.109–111 e 114. Limite de atributo por incremento: **20**. O motor aceita +2 em um atributo ou +1 em dois nos níveis 8, 12, 16 e 19. O talento inicial de haste já está modelado. **Talentos futuros não implementados são recusados com erro explícito** até que suas regras sejam adicionadas e testadas; não recebem bônus inventados ou silenciosamente ignorados.

A progressão não é acionada só por XP: exige confirmação do nível, resultado do d10 físico e escolhas necessárias. O XP é informativo e pode ser mantido conforme o método da mesa. Subir de nível não equivale a descansar, curar ou recuperar recursos gastos.

## 8. Uso técnico

Executar dentro desta pasta, com Node.js 24.12 ou superior. Testes e consulta não exigem instalação de pacotes:

```bash
npm test
npm run ficha
```

`npm run ficha` imprime JSON com `record`, `calculated` e `sources`, sem escrever arquivos ou acessar a rede. Os cálculos TypeScript não dependem de React, Firebase ou navegador.

Exemplo de integração futura — **valores hipotéticos de teste, não rolagens reais de Percival**:

```ts
import { PERCIVAL } from './src/percival/data.ts';
import { calculatePercival, levelUp } from './src/percival/rules.ts';

// Supondo que o jogador informe 7 como resultado físico do d10:
const nivel7 = levelUp(PERCIVAL, { hitDieResult: 7 });
const ficha7 = calculatePercival(nivel7); // 73 PV; alerta sobre o homebrew do nível 7.

// Mais tarde, supondo outro 7 e a escolha explícita de +2 Constituição:
const nivel8 = levelUp(nivel7, {
  hitDieResult: 7,
  improvement: { kind: 'ability', increases: { con: 2 } },
});
const ficha8 = calculatePercival(nivel8); // 90 PV, incluindo Constituição retroativa.
```

`levelUp` retorna um novo registro e não altera `PERCIVAL`. A interface futura deve persistir esse registro somente depois da confirmação do jogador. Recursos gastos e efeitos ativos precisam de um estado de sessão separado; recalcular a ficha não deve apagá-los. O documento que você está lendo não é regenerado pelo comando: ele é a referência do nível 6; `calculated` é a saída atualizada.

### Organização

- `src/percival/data.ts`: dados exclusivos, texto homebrew e proveniência.
- `src/percival/types.ts`: contrato dos dados e escolhas de evolução.
- `src/percival/tables.ts`: XP, espaços e catálogo de magias, com fontes.
- `src/percival/features.ts`: características confirmadas e seus níveis.
- `src/percival/rules.ts`: cálculo puro, validação, evolução e expressão de Smite.
- `scripts/show-percival.mjs`: consulta executável, somente leitura.
- `tests/percival.test.mjs`: testes do nível 6, evolução até 20, limites, itens e isolamento dos dados.

## 9. Pendências que não devem ser preenchidas por adivinhação

1. Perícia adicional de humano variante.
2. Distribuição dos dois bônus raciais de +1, para histórico; não muda os valores já preservados.
3. Idioma adicional e tipo de kit de jogo de Soldado.
4. Sintonização do Amuleto do Devoto.
5. Concessão de Vínculo Protetor, Oração Curativa e Repouso Tranquilo por regra adicional da mesa.
6. Características homebrew dos níveis 7, 15 e 20 e detalhes operacionais da Marca de Sangue.
7. Conferência de inventário, moedas e estado de sessão no momento da migração (a ficha do Pesadelo Sanguinário já foi confirmada como Cavalo de Guerra com Cota de talas).

## Fontes locais e rastreabilidade

**Livro:** `dd-5e-livro-do-jogador-fundo-branco-biblioteca-elfica.pdf`, nesta pasta. As referências usam as **páginas impressas**. Nesta cópia, a página do visualizador é a impressa menos 1: por exemplo, a tabela de paladino está na impressa 109, página 108 do PDF. Foram seguidas as regras desta cópia, da linha de D&D 5e de 2014, sem misturar a revisão de 2024.

| Assunto | Página impressa | Página do PDF |
|---|---:|---:|
| Evolução, XP e proficiência | 15 | 14 |
| Humano variante | 31 | 30 |
| Paladino: tabela, PV, habilidades e cálculos | 109–111 | 108–110 |
| Magias de Vingança | 114 | 113 |
| Soldado | 142 | 141 |
| Armaduras / armas | 147 / 151 | 146 / 150 |
| Talento de haste | 170 | 169 |
| Modificadores / Constituição retroativa | 175 / 179 | 174 / 178 |
| Descansos | 188 | 187 |
| Críticos e cobertura | 198 | 197 |
| Lista de magias de paladino | 214 | 213 |
| Destruição Trovejante | 239 | 238 |

SHA-256 do PDF consultado:

```text
ed6028a48dc566e91720b68a24d38eb4f8c927b071cab151739a7f15f08a4a91
```

**Cadastro antigo:** `C:/Users/JAJ/Documents/coisas/Programa/peric-ficha/PERCI/src/lib/defaultData.ts`, consultado somente para leitura. É um cadastro inicial do código, não um export dos dados atuais do jogador.

**Regras da mesa:** texto do Juramento de Sangue e confirmações de criação/evolução enviados pelo usuário nesta conversa. Itens mágicos e montaria importados estão rotulados separadamente: não foram apresentados como conteúdo deste Livro do Jogador.
