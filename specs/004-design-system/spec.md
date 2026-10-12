# 004 — Design system e escolha da biblioteca de componentes

**Status:** Clarified — pronto para Plan · **Criado:** 2026-10-12 · **Bloqueia:** 001 (Fase 3, UI) e 003

## Contexto
O client precisa de uma base visual única antes das telas: temas claro e escuro, tipografia, ícones, responsividade e uma biblioteca de componentes. Escolher a biblioteca é difícil de reverter, então a decisão sai de uma **PoC comparativa** e não de preferência.

## Histórias de usuário

### US1 — Tema claro e escuro (P1)
Como visitante, quero que o app respeite o tema do meu sistema e me deixe trocar manualmente.

**Aceite**
1. Na primeira visita, o tema segue `prefers-color-scheme`.
2. Há um botão de alternar tema visível em todas as páginas (header), acessível por teclado e com `aria-label`.
3. A escolha manual fica salva e é aplicada antes da primeira pintura (sem flash do tema errado).
4. Os dois temas passam no contraste WCAG AA, inclusive nos estados de foco, erro e desabilitado.

### US2 — Responsivo e amigável (P1)
**Aceite**
1. Todas as telas funcionam de 360 px a 1440 px+, sem scroll horizontal.
2. Alvos de toque ≥ 44 × 44 px no mobile.
3. A ação principal de cada tela é a mais destacada visualmente.

### US3 — Identidade visual (P2)
**Aceite**
1. Duas famílias tipográficas: uma de display (títulos, números sorteados) e uma de texto (UI). Auto-hospedadas e com `font-display: swap`.
2. Ícones em SVG de um único conjunto consistente; ilustrações SVG pontuais na landing e no resultado do sorteio.
3. Paleta, espaçamentos, raios e sombras definidos como tokens.

## Requisitos funcionais
- **FR-401** Design tokens em CSS custom properties (`--color-*`, `--space-*`, `--radius-*`, `--font-*`), com um conjunto por tema.
- **FR-402** Serviço de tema: `system | light | dark`; o atributo `data-theme` no `<html>`; persistência em `localStorage`; um script inline no `index.html` evita o flash.
- **FR-403** Os componentes da biblioteca escolhida são tematizados a partir dos **nossos** tokens, e não o contrário.
- **FR-404** Layout base: header (logo, navegação, alternar tema), conteúdo e footer (termos, privacidade).
- **FR-405** Página interna `/_design` (só em dev) mostrando tokens e componentes nos dois temas, como referência viva.

## PoC: Angular Material × PrimeNG

**Objetivo:** construir **a mesma tela** com cada biblioteca e decidir por critérios objetivos.

**Tela da PoC** (cobre o que a 001 precisa):
- Header com alternância de tema.
- Abas "Lista | Intervalo"; textarea; dois campos numéricos; botão de importar arquivo.
- Configurações: número de ganhadores, dois toggles e um campo de título.
- Botão primário "Sortear" e secundário "Sortear e salvar".
- Diálogo de confirmação, toast/snackbar de "link copiado", card de resultado com lista de ganhadores.
- Estados de erro de validação e de carregamento.

**Critérios** (nota de 1 a 5, com pesos):

| Critério | Peso | Como medir |
|----------|------|------------|
| Temas claro/escuro dirigidos pelos nossos tokens | 3 | Esforço e linhas de override para chegar ao visual desejado nos dois temas |
| Liberdade visual (não parecer "template") | 3 | Avaliação lado a lado das telas |
| Acessibilidade | 3 | axe-core sem violações sérias; navegação por teclado completa |
| Tamanho do bundle | 2 | `ng build` — initial + lazy chunk da tela (KB gzip) |
| Cobertura de componentes (001, 002, 003) | 2 | Checklist de componentes necessários |
| Compatibilidade zoneless/signals e Angular 22 | 2 | Funciona sem `zone.js`; APIs com signals |
| DX e documentação | 1 | Tempo para construir a tela; qualidade da documentação |
| Manutenção e licença | 1 | Cadência de releases, licença, histórico de breaking changes |

**Saída:** [ADR 0001 — Biblioteca de componentes](../adr/0001-biblioteca-de-componentes.md) com as notas, prints dos dois temas, os bundles medidos e a decisão. O código da PoC é descartável e não entra na `main` (fica numa branch `poc/component-library`).

## Fora de escopo
- Construir uma biblioteca de componentes própria.
- Temas além de claro/escuro (alto contraste, cores personalizáveis).

## Clarificações
### 2026-10-12
- PoC entre **Angular Material e PrimeNG**. *(decisão do usuário)* Outras bibliotecas (ex.: Spartan/ui, headless com Tailwind) só entram se ambas forem reprovadas no critério de liberdade visual.
- Tema padrão: seguir o sistema. *(padrão proposto)*
- Fontes auto-hospedadas via `@fontsource`, sem Google Fonts em runtime. *(padrão proposto, constituição §5)*
