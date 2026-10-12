# 004 — Tasks: Design system e PoC de biblioteca

Pré-requisito: T005 da [001](../001-sorteio-lista/tasks.md) (Angular 22 + Vitest).

## Fase A — PoC (branch `poc/component-library`, descartável)
- [x] **D001** Criar dois apps Angular 22 isolados em `poc/material/` e `poc/primeng/`, com os mesmos tokens CSS de partida (paleta provisória clara/escura, 2 fontes via `@fontsource`).
- [x] **D002 [P]** Construir a tela da PoC (ver [spec](spec.md#poc-angular-material--primeng)) com **Angular Material** (M3, tema via `mat.theme` + overrides com os tokens).
- [x] **D003 [P]** Construir a mesma tela com **PrimeNG** (preset de tema próprio via `definePreset`, `darkModeSelector: '[data-theme="dark"]'`).
- [x] **D004** Medir em ambas: bundle (`ng build --stats-json`), axe-core (Playwright + `@axe-core/playwright`) nos dois temas, teclado, funcionamento sem `zone.js`, linhas de override de estilo e tempo gasto.
- [x] **D005** Prints lado a lado (mobile e desktop, claro e escuro) + tabela de notas → escrever o **ADR 0001** e apresentar para decisão.

## Fase B — Fundação (na `main`, após o ADR aceito)
- [ ] **D010** 🔴🟢 `ThemeService` (`system|light|dark`, persistência, reação a `prefers-color-scheme`) + script anti-flash no `index.html`. *(FR-402, US1)*
- [ ] **D011** Tokens definitivos (`src/styles/`), tipografia (display + texto), escala de espaçamento, breakpoints; integração com a biblioteca escolhida. *(FR-401, FR-403)*
- [ ] **D012** Conjunto de ícones SVG escolhido + componente/registro de ícones.
- [ ] **D013** 🔴🟢 Shell: header (logo SVG, navegação, alternar tema), footer (termos, privacidade), layout responsivo. *(FR-404)*
- [ ] **D014** Página `/_design` (só em dev) com tokens e componentes nos dois temas. *(FR-405)*
- [ ] **D015** e2e: tema persiste após reload, sem flash (screenshot no primeiro frame), axe nos dois temas.
