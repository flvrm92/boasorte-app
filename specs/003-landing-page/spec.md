# 003 — Landing page

**Status:** Clarified — pronto para Plan · **Criado:** 2026-10-11

## Contexto
Primeira impressão do produto: explicar o que o app faz, gerar confiança na justiça dos sorteios e levar o visitante a começar um sorteio em um clique.

## Histórias de usuário

### US1 — Entender e começar (P1)
Como visitante, quero entender em segundos o que o app faz e começar um sorteio imediatamente.

**Aceite**
1. Acima da dobra há um título claro e duas ações: "Sortear comentários" (Instagram/Facebook) e "Sortear uma lista".
2. "Sortear comentários" leva ao fluxo da 002 (conectar conta).
3. "Sortear uma lista" leva ao fluxo da 001.

### US2 — Confiar no resultado (P2)
**Aceite**
1. Há uma seção "Como funciona" em 3–4 passos.
2. Há uma seção explicando por que o sorteio é justo (aleatoriedade segura, link de resultado imutável).
3. Há um FAQ (ex.: quais redes, é grátis?, posts privados, limite de comentários).

## Requisitos funcionais
- **FR-201** A página é responsiva (360 px a desktop) e acessível (WCAG 2.1 AA).
- **FR-202** SEO: título, meta description, Open Graph e conteúdo indexável. A landing é pré-renderizada no build (prerender do Angular).
- **FR-203** Páginas de termos de uso e política de privacidade. A política é **obrigatória para o App Review da Meta** (ver 002) e deve explicar o uso de dados de comentários e a exclusão de dados.
- **FR-205** O FAQ deixa claro que o sorteio de comentários funciona com posts da própria conta Business/Creator ou Página.
- **FR-204** LCP < 2,5 s em 4G.

## Fora de escopo
- Blog, depoimentos, área logada e seção de preços (tudo é free no MVP).

## Clarificações
### 2026-10-11
- Sem planos pagos no MVP, então não há seção de preços. *(padrão proposto)*
- Prerender da landing para SEO. *(padrão proposto)*
- A política de privacidade passa a ser pré-requisito da 002. *(consequência da decisão OAuth)*
