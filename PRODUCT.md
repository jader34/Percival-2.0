# Percival — ficha de sessão

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
React + TypeScript + Vite. Usuário aprovou manter React e salvamento neste aparelho, sem login ou sincronização nesta primeira versão.

## Users
Um jogador, durante sessões presenciais de RPG, utilizando principalmente um celular e dados físicos.

## Product Purpose
Consultar e operar a ficha exclusiva de Percival sem interromper a mesa. Vida, ataques, magias e recursos precisam ser rápidos e confiáveis; a descrição completa é consulta secundária.

## Operating Context
Paladino nível 6, humano variante, Soldado, Juramento de Sangue homebrew. Magias de juramento seguem Vingança. O livro local e PERCIVAL.md fundamentam a matemática. Rolagens sempre físicas. A base atual é cadastro inicial, não exportação da sessão antiga.

## Capabilities and Constraints
Primeira versão: combate, magias, inventário, consulta de atributos e traços, registro de PV e recursos, efeitos persistentes, notas e evolução com d10 físico. Estado salvo localmente e exportável; nada no Firebase antigo deve ser acessado ou alterado. Não afirmar sincronização. Confirmações de regras pendentes precisam permanecer explícitas. Desfazer gastos e confirmações para descanso/evolução protegem contra toque acidental.

## Brand Commitments
Interface mobile-first. Estética de sangue solicitada explicitamente pelo usuário. Nome Percival, alcunha O Triturador, Juramento de Sangue. Português brasileiro. Preservar legibilidade durante combate e não incluir dados virtuais.

## Evidence on Hand
src/percival/data.ts, rules.ts, tables.ts, features.ts; PERCIVAL.md; Livro do Jogador PDF local; testes existentes. Sem retrato confirmado de Percival: não inventar representação física como factual.

## Product Principles
- A sessão não perde efeitos ao trocar de aba.
- O dado está na mesa; o aplicativo calcula e registra.
- Nenhuma regra caseira é presumida.
- A informação necessária agora vem antes da descrição completa.
- Dados locais são do jogador: exportar, importar e avisar quando salvar falha.
