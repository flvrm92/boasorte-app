# 003 — Plano técnico: Landing page, termos e privacidade

**Spec:** [spec.md](spec.md) · **Tasks:** [tasks.md](tasks.md) · **Base visual:** [004](../004-design-system/spec.md)

## Decisões

| Tema | Decisão | Motivo |
|------|---------|--------|
| Renderização | `@angular/ssr` com `outputMode: "static"`: **prerender** de `/`, `/termos` e `/privacidade`; as demais rotas continuam renderizadas no cliente (`RenderMode.Client`) | FR-202 (conteúdo indexável) sem servidor Node: o build continua sendo arquivos estáticos servidos pelo nginx. |
| Hidratação | `provideClientHydration()` **sem** event replay | O event replay injeta um `<script>` inline, que a CSP `script-src 'self'` bloquearia. |
| Fallback de SPA | nginx `try_files $uri $uri/index.html /index.csr.html` | O build estático gera HTML por rota prerenderizada e um `index.csr.html` para as rotas do cliente. Sem isso, `/sorteio/lista` receberia o HTML prerenderizado da home. |
| Código só de navegador | `ThemeService` só toca `matchMedia`/`localStorage` no navegador (`isPlatformBrowser`) | O prerender roda em Node, sem `window`. |
| SEO | `SeoService` aplica título, description, canonical e Open Graph a partir do `data` de cada rota; `robots.txt` e `sitemap.xml` estáticos; imagem OG 1200×630 gerada a partir de um SVG | FR-202. |
| Dados legais | Controlador (razão social e CNPJ), e-mail e hospedagem num único arquivo, `legal-entity.ts` | Uma única fonte de verdade. Os marcadores pendentes bloqueiam o deploy pelo checklist. |
| Conteúdo | Textos dos termos e da política em componentes Angular (HTML semântico), com data de vigência | Indexáveis, versionados no git e sem CMS. |
| "Sortear comentários" | Aparece como **"em breve"**, sem link | A 002 ainda não existe; um link para uma tela inexistente quebraria a US1.2. |

## Estrutura

```
src/app/
├── app.routes.server.ts          prerender: '', 'termos', 'privacidade' · demais: Client
├── app.config.server.ts          provideServerRendering(withRoutes(serverRoutes))
├── core/seo/seo.service.ts       título, description, canonical e OG por rota
└── features/
    ├── home/
    │   ├── home-page.ts           hero (prévia do resultado), como funciona, por que é justo, FAQ, CTA final
    │   └── faq.ts                 perguntas e respostas (dados) — usados também para JSON-LD FAQPage
    └── legal/
        ├── legal-entity.ts        razão social, CNPJ, e-mail, hospedagem, data de vigência
        ├── terms-page.ts
        └── privacy-page.ts
public/
├── robots.txt · sitemap.xml · og-image.png
```

## Conteúdo da landing

1. **Hero:** título e subtítulo com a proposta, CTA principal "Sortear uma lista" e "Sortear comentários" marcado *em breve*. Ao lado, um **cartão de resultado real** (bolas de loteria + link), que mostra o que o produto entrega em vez de uma ilustração genérica.
2. **Como funciona:** 3 passos numerados (é de fato uma sequência): adicionar participantes → configurar → sortear e compartilhar.
3. **Por que é justo:** aleatoriedade criptográfica, sorteio oficial no servidor, link que não muda.
4. **FAQ** (`<details>`): grátis?, conta?, quais redes (posts da própria conta Business/Creator ou Página — FR-205), limites, por quanto tempo o link vale, refazer um sorteio salvo, privacidade.
5. **CTA final** para o sorteio por lista.

## Política de privacidade (LGPD) — tópicos obrigatórios
Controlador e contato · dados tratados por funcionalidade (sorteio por lista: participantes, título, configuração; IP usado só no limite de requisições e não armazenado; preferência de tema no `localStorage`; **sem cookies e sem analytics**) · finalidades e bases legais · compartilhamento (nenhum; hospedagem no Brasil) · retenção (12 meses + 30 dias) · direitos do titular (art. 18) e como exercê-los · **exclusão de dados** (seção própria, exigida pelo App Review da Meta) · sorteio de comentários (002: token apenas na sessão; comentários não armazenados, exceto os vencedores de sorteios salvos) · segurança · alterações.

## Termos de uso — tópicos
O serviço · gratuidade · responsabilidades do organizador (direito de usar os dados dos participantes; promoções comerciais podem exigir autorização prévia — Lei 5.768/1971) · links públicos (quem tem o link vê o resultado) · usos proibidos · limitação de responsabilidade · alterações · lei e foro brasileiros · contato.

> Os textos são um ponto de partida técnico e **devem ser revisados por um advogado** antes do App Review da Meta.

## Testes
- **Unitários:** `SeoService`, `ThemeService` no servidor, home (CTAs, "em breve", FAQ), páginas legais (controlador, contato e seções obrigatórias).
- **E2E:** o HTML bruto (sem JavaScript) de `/`, `/termos` e `/privacidade` já contém o conteúdo; a navegação dos CTAs; axe nos dois temas; nenhum erro de console (CSP com hidratação); `/sorteio/lista` acessado direto continua funcionando (fallback `index.csr.html`).

## Verificação da constituição
§2 FR rastreados nas tasks · §3 TDD · §5 responsivo, temas, a11y, sem CDNs · §7 política de privacidade alinhada ao que o sistema realmente faz (sem cookies, IP não armazenado, retenção de 12 meses) · §8 sem CMS e sem servidor Node.
