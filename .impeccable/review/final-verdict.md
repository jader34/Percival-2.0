## verdict

- **P1 — navegação desktop sobre Reservas: resolved.** As recapturas válidas `desktop.png` (1440×900) e `desktop-1000.png` (1000×900) mostram a navegação confinada à lateral esquerda, sem sobrepor o conteúdo principal ou Reservas. `navigation-fix.json` registra `navLeft: 22`, `navRight: 202` e `mainLeft: 252` nas duas larguras. Em `src/styles.css:1709`, `right: auto` está restrito a `@media (min-width: 1000px)`.
- **Preservação mobile: confirmada no recorte.** `mobile.png` (390×844) mostra os quatro itens na barra inferior de largura total; a regra base mantém `bottom: 0`, `left: 0` e `right: 0`. Nenhuma regressão visível atribuível à correção nas capturas examinadas.

## remaining

clear — somente para a correção P1 pontuada e a preservação mobile observada. Este Verdict Pass não constitui aprovação integral da interface nem auditoria completa de acessibilidade. Nenhuma UI foi editada; legado/Firebase não foram acessados.

disposition: ship
