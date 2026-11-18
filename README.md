# Percival · Juramento de Sangue

Ficha mobile exclusiva de Percival, em React + TypeScript + Vite. A base começa no nível 6, com 64 PV. Todas as rolagens são físicas; o aplicativo mostra fórmulas e registra resultados informados.

## Executar

Requer Node.js >=24.12.0, conforme `package.json`.

```sh
npm ci
npm run dev
```

Servidor local: `http://127.0.0.1:4173`. Acesso restrito ao próprio computador por padrão. O endereço localhost do computador não abre a aplicação em outro celular.

```sh
npm test          # regras e estado de sessão
npm run test:ui   # regressões de apresentação
npm run build    # TypeScript estrito e pacote em dist/
npm run preview  # prévia do pacote na porta 4174
npm run ficha    # consulta JSON do cadastro e das regras
```

## Nesta versão

- **Combate:** dano, cura, PV temporários, salvaguardas contra a morte em 0 PV, gasto e recuperação de Dados de Vida (`d10`), desfazer, ataques, Smite, recursos, descanso, Bênção, Véu de Sangue e ficha operacional da montaria **Pesadelo Sanguinário** (*Cavalo de Guerra* com barda de *Cota de talas*, CA 17, 19 PV e `3d10` Dados de Vida).
- **Magias:** busca sem depender de acentos, preparação, espaços compartilhados com Smite, registro de concentração e referências curtas.
- **Inventário:** equipar/desequipar, quantidades e consumo de poção com resultado físico informado.
- **Ficha:** experiência (XP atual `18.967`, soma automática de XP ganho e progresso para o próximo nível), atributos, salvaguardas, perícias, características, notas e evolução. Subir de nível exige resultado de d10 e, quando necessário, escolha de atributos; não cura nem restaura gastos automaticamente.
- **Ajustes:** confirmações explícitas de sintonização/perícia/magias adicionais, exportação e importação de backup validado.

## Dados e segurança

O estado é salvo em `localStorage`, chave `percival-session-v1`, neste navegador e nesta origem. Outro navegador, porta ou aparelho tem seu próprio arquivo. Não há conta, Firebase, sincronização ou acesso à ficha antiga.

Exporte periodicamente um backup em **Ajustes → Exportar backup**. Limpar os dados do navegador pode apagar a ficha local. Importar substitui a sessão atual mediante confirmação. Arquivos inválidos são rejeitados; um arquivo local ilegível não é sobrescrito automaticamente. Falhas de salvamento são avisadas. Evite operar a mesma origem em duas abas: quando outra aba altera a sessão, o salvamento desta aba é bloqueado até recuperação explícita.

## Limites intencionais

- Não é uma automação integral de D&D: alvos, duração em rodadas/minutos, marcas de sangue, condições, testes de concentração e resistência a dano são acompanhados na mesa.
- Conjurar registra espaço e concentração, não aplica automaticamente todos os efeitos. Por exemplo, Escudo da Fé pede acompanhamento manual da CA do alvo.
- Quantidade de moedas é informativa nesta primeira interface.
- Novos talentos não automatizados e habilidades futuras do juramento não são inventados. Consulte as pendências em **Ficha** e `PERCIVAL.md`.
- Não há service worker nem garantia de abrir/recarregar sem conexão ao servidor. Persistência local não significa instalação offline.
- Responsividade foi verificada em navegador Chromium com viewports emulados, não em um aparelho físico ou Safari/iOS.

## Organização

- `src/percival/`: cadastro, tabelas e funções puras de regras.
- `src/session/state.ts`: ações, gastos, histórico, desfazer e validação de backup.
- `src/App.tsx`: navegação e persistência no navegador.
- `src/components/`: interfaces de combate, magias, inventário, ficha e diálogos.
- `src/tokens.css`, `src/styles.css`: identidade visual e regras responsivas.
- `PERCIVAL.md`: fontes, matemática e decisões de ficha.
- `.impeccable/review/`: evidências de QA e revisão visual.

O PDF local é fonte de consulta, não conteúdo redistribuído no bundle público. O projeto antigo em `Programa/peric-ficha/PERCI` permanece separado.
