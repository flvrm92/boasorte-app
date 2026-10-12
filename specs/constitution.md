# Constituição — BoaSorte

Princípios que valem para todas as features. Um `plan.md` que viole algum deles precisa justificar a exceção explicitamente.

## 1. Sorteio justo e auditável
- A aleatoriedade usa um gerador criptograficamente seguro (nunca `Math.random()` / `System.Random`).
- Todo sorteio registra: participantes elegíveis (após filtros), configuração aplicada, data/hora (UTC) e resultado.
- Um resultado salvo/compartilhado é **imutável**: quem abre o link vê exatamente o mesmo resultado, e não um novo sorteio.

## 2. Spec antes de código
- Todo requisito implementado rastreia para um `FR-xxx` de uma spec.
- Mudança de comportamento começa alterando a spec, depois o código.
- Decisões técnicas relevantes viram ADR em `specs/adr/NNNN-titulo.md` (contexto, opções, decisão, consequências).

## 3. TDD
- Todo código de produção nasce de um teste que falhou primeiro (red → green → refactor), na API e no client.
- Cada critério de aceite de uma spec vira pelo menos um teste (unitário, de integração ou e2e).
- Testes descrevem comportamento, não implementação: sem mocks do que é nosso dentro da mesma camada; mocks/fakes só nas fronteiras (portas).

## 4. Arquitetura da API (Clean Architecture)
Quatro projetos, com dependências apontando **só para dentro**:

```
Api ──▶ Application ──▶ Domain
 └────▶ Infrastructure ─┘ (implementa as portas da Application)
```

| Camada | Contém | Não pode |
|--------|--------|----------|
| **Domain** | Entidades/agregados, **value objects**, serviços de domínio, erros de domínio | Referenciar EF Core, ASP.NET, I/O ou qualquer outro projeto |
| **Application** | Casos de uso (um handler por caso), portas (`IDrawRepository`, `IRandomSource`…), DTOs de entrada/saída | Conhecer HTTP, EF Core ou detalhes de infraestrutura |
| **Infrastructure** | EF Core/Npgsql, repositórios, implementações das portas, jobs em background | Conter regra de negócio |
| **Api** | Endpoints (Minimal API), mapeamento HTTP ↔ casos de uso, ProblemDetails, composição (DI) | Conter regra de negócio ou acessar o `DbContext` diretamente |

- **Value objects** sempre que um conceito tem invariantes (ex.: `PublicId`, `Participant`, `NumberRange`, `WinnersCount`). Eles são imutáveis, validados na criação e com igualdade por valor. Um VO inválido não pode existir.
- **Entidades** protegem as próprias invariantes: construtor privado, criação por factory method e nenhum setter público.
- **Erros esperados** (validação, não encontrado, expirado) fluem como `Result`/erros de domínio, não como exceções. Exceções ficam para falhas inesperadas.
- **SOLID**, de forma pragmática: uma responsabilidade por classe/handler (S); novas redes sociais entram como novas implementações de uma porta, sem alterar os casos de uso (O/L); portas pequenas e específicas (I); a Application depende de abstrações e a Infrastructure as implementa (D).
- Sem MediatR nem AutoMapper: handlers são classes simples injetadas e o mapeamento é explícito.
- Tempo via `TimeProvider` (testável); nunca `DateTime.UtcNow` direto.

## 5. Client (Angular)
- Testes de unidade com **Vitest**; e2e com **Playwright**.
- Regras de domínio do client ficam em funções puras, separadas dos componentes, e são testadas primeiro.
- UI clara e amigável: ação principal sempre evidente e mensagens de erro que dizem o que fazer.
- **Totalmente responsiva**, mobile-first (a partir de 360 px).
- **Temas claro e escuro**: segue o sistema por padrão, com alternância manual que fica salva e sem "flash" do tema errado ao carregar.
- Acessibilidade WCAG 2.1 AA: contraste nos dois temas, navegação por teclado, foco visível e `prefers-reduced-motion`.
- Visual definido por **design tokens** (CSS custom properties); componentes não usam cores literais.
- Ícones em SVG; fontes auto-hospedadas (sem chamadas a CDNs de terceiros em runtime).

## 6. Fronteira clara entre app e API
- Comunicação somente por contratos HTTP versionados (`/api/v1`), documentados em `specs/<feature>/contracts/`.
- O frontend não chama redes sociais diretamente; credenciais e tokens ficam só no backend.

## 7. Privacidade e conformidade
- Coletamos o mínimo de dados de terceiros (nome de usuário público + texto do comentário).
- Respeitamos os termos de uso das plataformas de origem dos dados.
- Dados de sorteios têm política de retenção definida.

## 8. Simplicidade
- Sem abstrações especulativas: só se constrói o que uma spec pede. Uma porta existe porque há uma fronteira real (I/O, aleatoriedade, tempo), não "por via das dúvidas".
- Pt-BR é o idioma da interface; código e identificadores em inglês.

## Stack de referência
- Frontend: Angular 22 (standalone, zoneless, signals), SCSS, Vitest, Playwright; Node ≥ 24.15 (`.nvmrc`). Biblioteca de componentes: decidida pela PoC da [004](004-design-system/spec.md).
- Backend: .NET 10 Minimal API, OpenAPI, xUnit v3 sobre o Microsoft.Testing.Platform, Testcontainers, NetArchTest.
- Persistência: PostgreSQL 18 + EF Core (Npgsql).
- Hospedagem: VPS com **Dokploy** (Traefik + Docker Swarm), domínio **boasorte.app**. Front e API na mesma origem (`/` e `/api/*`). Postgres gerenciado pelo Dokploy; backups por script próprio na VPS.
- Provedores externos: definidos nos `plan.md`.
