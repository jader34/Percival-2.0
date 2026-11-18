# Verificação funcional — primeira interface

## Executado

- `npm test`: 66 testes de regras e estado aprovados.
- `npm run test:ui`: 6 testes de regressão de interface aprovados.
- `npm run build`: TypeScript estrito e Vite aprovados; JS principal 307,96 kB, gzip 96,43 kB na verificação registrada.
- Detector Impeccable sobre `src/`: `[]`.
- `browser-checks.json`: 56 verificações de navegador aprovadas, com contagem agregada em Python.

## Navegador

Chromium, sessão de QA isolada, servidor local sem conexão com Firebase. Abas de combate/magias/inventário/ficha verificadas em 320×568, 360×640, 390×844, 768×900 e 1440×900. Sem rolagem horizontal nos tamanhos testados. Fechar modal visível; Escape fecha e devolve foco. Nenhum erro JS capturado nos fluxos instrumentados.

Fluxos: temporários absorvem dano, desfazer, Bênção/Véu entre abas e recarga, Smite/crítico/gasto, busca sem acentos, conjuração/concentração, inventário, notas, evolução 6→7 com d10=7 (máximo73, atual64), exportação baixada e lida, importação pelo input de arquivo, backup corrompido preservado, erro de recurso dentro do modal.

## Revisão visual

Capturas finais em `mobile.png`, `desktop.png`, `desktop-1000.png` e `dialog-320.png`. No celular 390×844, Smite termina em y=706,69 e a navegação começa em y=771: a ação está visível na primeira tela.

A revisão independente identificou sobreposição da navegação desktop: `right: 0` herdado do mobile. Foi corrigida com `right: auto` no breakpoint desktop. Medições reais pós-correção em `navigation-fix.json`: navegação entre x=22 e x=202, conteúdo começando em x=252, tanto em 1000px quanto em 1440px. Navegação inferior preservada em 390px. As quatro capturas foram refeitas e abertas. Testes de regras, interface e build foram reexecutados com sucesso após essa mudança. O parecer específico da correção é registrado em `final-verdict.md`; ele não constitui auditoria completa de acessibilidade.

## Escopo não verificado

Aparelhos físicos, Safari/iOS, instalação PWA, operação offline e deploy público não foram testados ou prometidos. Regras homebrew futuras continuam pendentes. Dados da sessão antiga não foram migrados nem acessados nesta implementação.
