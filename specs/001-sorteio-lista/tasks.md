# 001 — Tasks: Sorteio por lista

Legenda: **[P]** = pode rodar em paralelo com outras [P] da mesma fase · **API** = `boasorte-api` · **APP** = `boasorte-app` · **OPS** = `deploy/`
Regra TDD: a task de teste vem **antes** da implementação e precisa falhar primeiro (red → green → refactor).

## Fase 0 — Setup
- [ ] **T001 API** Mover `boasorte-api.slnx` para a raiz do repo; criar `boasorte-api.Tests` (xUnit v3, `Microsoft.AspNetCore.Mvc.Testing`, `Testcontainers.PostgreSql`) e adicioná-lo à solution; remover o endpoint `weatherforecast`.
- [ ] **T002 API** Adicionar `Npgsql.EntityFrameworkCore.PostgreSQL`, `Microsoft.EntityFrameworkCore.Design` e `EFCore.NamingConventions`; criar `AppDbContext` vazio; connection string em `appsettings.Development.json`/user-secrets.
- [ ] **T003 OPS** `deploy/docker-compose.dev.yml` com Postgres 17 (porta 5432, volume nomeado).
- [ ] **T004 API** `Program.cs`: `AddProblemDetails`, `AddValidation`, `ForwardedHeaders`, remover `UseHttpsRedirection`, `GET /api/health` com check do banco.
- [ ] **T005 APP** `provideHttpClient(withFetch())`, `proxy.conf.json` (`/api` → porta da API em `launchSettings.json`), rotas `''`, `sorteio/lista` e `s/:publicId` com páginas vazias; `npm i papaparse @types/papaparse`.

**Checkpoint:** `docker compose -f deploy/docker-compose.dev.yml up`, `dotnet run` e `ng serve` sobem; `GET /api/health` → 200 pelo proxy do Angular.

## Fase 1 — Domínio (TDD, sem I/O)
- [ ] **T010 [P] API** Testes de `ParticipantRules` lendo `specs/001-sorteio-lista/contracts/normalization-cases.json` (copiado para o projeto de testes ou referenciado por caminho) + limite de 200 caracteres. *(FR-003, FR-004)*
- [ ] **T011 API** Implementar `ParticipantRules`.
- [ ] **T012 [P] API** Testes de `WinnerPicker` com um `IRandomSource` falso: k distintos, ordem, k > elegíveis lança erro, intervalo inclui as bordas, intervalo grande sem materializar. Teste estatístico leve: 10.000 sorteios de 1 entre 5 dão frequências dentro de ±10%. *(FR-005, FR-006)*
- [ ] **T013 API** Implementar `WinnerPicker` + `CryptoRandomSource`.
- [ ] **T014 [P] API** Testes + implementação de `PublicId` (12 caracteres, alfabeto base62).
- [ ] **T015 [P] APP** Testes de `participants.ts` com o mesmo `normalization-cases.json`. *(FR-003, FR-004)*
- [ ] **T016 APP** Implementar `participants.ts`.
- [ ] **T017 [P] APP** Testes de `pick-winners.ts` (mesmos cenários da T012, com fonte aleatória injetável).
- [ ] **T018 APP** Implementar `pick-winners.ts` com `crypto.getRandomValues` + rejection sampling.
- [ ] **T019 [P] APP** Testes de `parse-file.ts`: TXT (CRLF/LF, BOM), CSV com `,` e `;`, aspas, cabeçalho, escolha de coluna, arquivo > 1 MB ou > 10.000 linhas, extensão inválida. *(FR-002, US3)*
- [ ] **T020 APP** Implementar `parse-file.ts` sobre o `papaparse`.

**Checkpoint:** todos os testes de domínio verdes nos dois repos.

## Fase 2 — API
- [ ] **T030 API** `DrawEntity` + configuração conforme [data-model.md](data-model.md); migração `InitialDraws`; `MigrateAsync` no startup.
- [ ] **T031 API** Fixture de integração: `WebApplicationFactory` + container Postgres compartilhado por coleção.
- [ ] **T032 API** Testes de integração do `POST /api/v1/draws`: 201 + `Location` (lista e intervalo); cada regra de validação do contrato → 400 com o campo certo; `participants` = `null` quando oculto. *(US1, US2, US5, FR-009)*
- [ ] **T033 API** Implementar o `POST` (limite de corpo de 3 MB).
- [ ] **T034 API** Testes do `GET /api/v1/draws/{publicId}`: 200 com o resultado idêntico em duas leituras; 404; 410 com `expires_at` no passado. *(US5.3, FR-011)*
- [ ] **T035 API** Implementar o `GET`.
- [ ] **T036 API** Teste + rate limit de 10/min por IP no `POST` → 429. *(FR-013)*
- [ ] **T037 API** `ExpiredDrawsPurger` (`BackgroundService` diário) + teste de integração da query de purga. *(FR-011)*

**Checkpoint:** `dotnet test` verde; OpenAPI em `/openapi/v1.json` coerente com [contracts/api.md](contracts/api.md).

## Fase 3 — App
- [ ] **T040 APP** `draw.models.ts` (tipos do contrato) + `draw-api.ts`, com testes via `HttpTestingController`.
- [ ] **T041 APP** `participants-input`: abas Lista/Intervalo, textarea, validação do intervalo, contador "X entradas · Y elegíveis" reativo. *(US1, US2, US4.3)*
- [ ] **T042 APP** `file-import`: botão de importar; para CSV com várias colunas, seletor de coluna + "primeira linha é cabeçalho"; preenche o textarea, que continua editável. *(US3)*
- [ ] **T043 APP** `draw-settings`: título, nº de ganhadores (limitado aos elegíveis), remover duplicados, exibir participantes no link. *(FR-004, FR-005, FR-009)*
- [ ] **T044 APP** `draw-result` + sorteio rápido: animação ≤ 3 s (instantânea com `prefers-reduced-motion`), ganhadores em ordem, "sortear novamente". *(FR-007, FR-008)*
- [ ] **T045 APP** "Sortear e salvar": aviso de que é um sorteio novo e oficial → `POST` → mostra o link + "copiar link"; trata 400/429. *(US5.1, FR-012)*
- [ ] **T046 APP** `shared-draw-page` em `/s/:publicId`: dados do sorteio, participantes (se houver), estados de carregando, 404 e 410. *(US5.2–5.4)*
- [ ] **T047 APP** Revisão de responsividade (360 px+) e acessibilidade: labels, foco, `aria-live` no resultado, contraste.

**Checkpoint:** `ng test` verde; fluxo completo funcionando localmente.

## Fase 4 — E2E e implantação
- [ ] **T050 APP** Playwright: (a) lista → sorteio rápido → resultado (US1); (b) importar TXT → sortear e salvar → abrir o link → mesmo resultado em dois acessos (US3 + US5).
- [ ] **T051 APP** `boasorte-app/Dockerfile` (`node:24` build → `nginx:alpine`) + `nginx.conf` (fallback de SPA, cache de assets com hash, HSTS/CSP/`X-Content-Type-Options`); conferir que `docker build` roda localmente.
- [ ] **T052 API** Ajustar o `Dockerfile` da API (só a 8080) e documentar as variáveis de ambiente necessárias (`ConnectionStrings__Default`, `ASPNETCORE_ENVIRONMENT`).
- [ ] **T053 OPS** Dokploy: criar o Database Postgres, as Applications `web` e `api` (provider GitHub, build path/Dockerfile), domínios (`/` e `/api`, sem strip path, HTTPS Let's Encrypt), variáveis de ambiente, health check e auto-deploy.
- [ ] **T054 OPS** Dokploy: destino S3 + backup diário do Postgres (retenção de 7 dias); testar um restore uma vez e documentar em `deploy/README.md`.
- [ ] **T055 OPS** Primeiro deploy + smoke test do e2e (a) contra o domínio; conferir no log que o rate limit enxerga o IP real do cliente.

**Checkpoint final:** todos os critérios de aceite da spec verificados; critérios de sucesso medidos (sorteio de 10.000 em < 1 s).
