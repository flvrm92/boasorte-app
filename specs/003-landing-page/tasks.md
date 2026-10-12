# 003 — Tasks: Landing page, termos e privacidade

Legenda: 🔴 teste antes · 🟢 implementação.

## Fase 1 — Prerender e SEO
- [x] **L001** 🔴🟢 `ThemeService` sem acesso a `window`/`localStorage` no servidor (teste com `PLATFORM_ID = 'server'`).
- [x] **L002** `ng add @angular/ssr` com `outputMode: "static"`; `app.routes.server.ts` (prerender de `''`, `termos` e `privacidade`; demais `Client`); `provideClientHydration()` sem event replay. *(FR-202)*
- [x] **L003** nginx: fallback para `index.csr.html`; `docker build` + ensaio local. *(FR-202)*
- [x] **L004** 🔴🟢 `SeoService`: título, description, canonical e OG por rota a partir do `data`. *(FR-202)*
- [x] **L005** `robots.txt`, `sitemap.xml` e `og-image.png` (1200×630, gerada de um SVG da marca).

## Fase 2 — Landing
- [x] **L010** 🔴🟢 Hero: título, subtítulo, CTA "Sortear uma lista" → `/sorteio/lista`, "Sortear comentários" *em breve* e cartão de resultado com bolas. *(US1)*
- [x] **L011** 🔴🟢 "Como funciona" (3 passos) e "Por que é justo". *(US2.1, US2.2)*
- [x] **L012** 🔴🟢 FAQ acessível (`<details>`) + JSON-LD `FAQPage`. *(US2.3, FR-205)*
- [x] **L013** Header: logo → home, "Sortear lista" e tema, também no mobile. O atalho de comentários entra no header junto com a 002 (hoje fica só na landing, como *em breve*). *(US4)*

## Fase 3 — Termos e privacidade
- [x] **L020** `legal-entity.ts` + `npm run check:legal`, que falha com marcadores pendentes (hoje: razão social e CNPJ); item obrigatório no checklist de deploy. *(FR-203)*
- [x] **L021** 🔴🟢 Política de privacidade (tópicos do plano, incluindo a seção de exclusão de dados). *(FR-203)*
- [x] **L022** 🔴🟢 Termos de uso. *(FR-203)*

## Fase 4 — Verificação
- [x] **L030** E2E: HTML prerenderizado contém o conteúdo; CTAs; deep link `/sorteio/lista`; axe nos dois temas; sem erros de console. *(FR-201, FR-202)*
- [x] **L031** Revisão visual: 360 px a desktop, nos dois temas. *(FR-201)*
- [x] **L032** LCP medido no ensaio local (Slow 4G: 1,6 Mbps, 150 ms; CPU 4×): home ≈ 1,0 s, `/sorteio/lista` ≈ 1,9 s. Meta < 2,5 s. *(FR-204)*
