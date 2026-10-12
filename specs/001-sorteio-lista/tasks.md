# 001 — Tasks: Sorteio por lista

Legenda: **[P]** = paralelizável com outras [P] da mesma fase · **API** = `boasorte-api` · **APP** = `boasorte-app` · **OPS** = infraestrutura/VPS
**TDD:** tasks marcadas com 🔴 são de teste e precedem a 🟢 de implementação. O teste precisa falhar pelo motivo certo antes da implementação.

## Fase 0 — Setup
- [x] **T001 API** Reestruturar o repo: `src/` com `BoaSorte.Domain`, `.Application`, `.Infrastructure`, `.Api` (o projeto atual vira `BoaSorte.Api`); `tests/` com os 4 projetos de teste; `BoaSorte.slnx` na raiz; `Directory.Build.props` (net10.0, Nullable, TreatWarningsAsErrors) e `Directory.Packages.props`; remover `weatherforecast`; mover o `Dockerfile` para a raiz (contexto multi-projeto).
- [x] **T002 API** 🔴🟢 `BoaSorte.Architecture.Tests` (NetArchTest): o Domain não referencia nenhum outro projeto, nem EF ou ASP.NET; a Application não referencia Infrastructure/Api/EF; a Infrastructure não referencia a Api.
- [x] **T003 OPS** `deploy/docker-compose.dev.yml` (neste repo) com Postgres 18 para dev local (porta padrão 5433, para não conflitar com um Postgres já existente na 5432).
- [x] **T004 API** Composição base da `BoaSorte.Api`: `AddProblemDetails`, `ForwardedHeaders`, sem `UseHttpsRedirection`, OpenAPI, `AddApplication()`/`AddInfrastructure()` vazios, `AppDbContext` vazio com Npgsql + `EFCore.NamingConventions`, `GET /api/health` com check do banco.
- [x] **T005 APP** Atualizar o Angular 20 → 21 → 22 (`ng update`); migrar Karma/Jasmine → **Vitest** (builder `@angular/build:unit-test`, schematic de refactor jasmine→vitest); remover as dependências do Karma; `ng test` verde.
- [x] **T006 APP** `provideHttpClient(withFetch())`, `proxy.conf.json` (`/api` → porta da API), rotas `''`, `sorteio/lista` e `s/:publicId` com páginas vazias; `npm i papaparse`.
- [x] **T007 APP** Playwright configurado (`npm run e2e`) com um teste de fumaça que abre `/`.

**Checkpoint:** `docker compose -f deploy/docker-compose.dev.yml up -d`, `dotnet test` (testes de arquitetura verdes), `dotnet run` e `ng serve` sobem; `GET /api/health` → 200 pelo proxy do Angular.

## Fase 1 — Domain da API (TDD puro, sem I/O)
- [x] **T010 API** 🔴🟢 `Result`/`Error` (Common).
- [x] **T011 API [P]** 🔴🟢 VO `Participant`: trim, vazio inválido, > 200 caracteres inválido, `DedupKey`.
- [x] **T012 API [P]** 🔴🟢 VO `NumberRange`: bordas, `Start > End`, limites de ±1 bi, `Count`.
- [x] **T013 API [P]** 🔴🟢 VOs `WinnersCount`, `DrawTitle`, `Winner`, `DrawSettings`.
- [x] **T014 API [P]** 🔴🟢 VO `PublicId`: `New` com random determinístico gera 12 caracteres base62; `Parse` rejeita tamanho/alfabeto inválidos.
- [x] **T015 API** 🔴 `ListPool` contra **todos** os casos de `contracts/normalization-cases.json` (arquivo linkado no `.csproj` de teste) + `SubmittedCount`. 🟢 Implementar `ListPool` e `RangePool`. *(FR-003, FR-004)*
- [x] **T016 API** 🔴 `WinnerSampler`: k distintos em `[0, n)`; k = n retorna uma permutação; n grande (2 bi) sem alocar n; sequência determinística com random falso; teste estatístico leve (10.000 × 1-de-5 com frequências em ±10%). 🟢 Floyd + Fisher–Yates. *(FR-006)*
- [x] **T017 API** 🔴 Agregado `Draw.Conduct`: k > elegíveis → erro com o nº de elegíveis; ganhadores em ordem e distintos; `ExpiresAt` = +12 meses; `IsExpiredAt`. 🟢 Implementar. *(FR-005, FR-006, FR-011)*

**Checkpoint:** `BoaSorte.Domain.Tests` verde; o Domain sem dependências (testes de arquitetura verdes).

## Fase 2 — Application da API
- [x] **T020 API** 🔴 `CreateDrawHandler` com fakes (`InMemoryDrawRepository`, `FakeTimeProvider`, random determinístico): lista e intervalo felizes; erros de validação por campo (título, participantes, intervalo, ganhadores); persiste exatamente o que retorna. 🟢 Implementar + `CreateDrawCommand`/`DrawDetails`. *(US1, US2, US4, FR-009)*
- [x] **T021 API** 🔴 `GetDrawHandler`: encontrado, `NotFound`, `Expired`; `participants` nulo quando `ShowParticipants = false` ou intervalo. 🟢 Implementar. *(US5.2, US5.3, FR-011)*
- [x] **T022 API** 🔴🟢 `PurgeExpiredDrawsHandler` (cutoff = agora − 30 dias).

**Checkpoint:** `BoaSorte.Application.Tests` verde sem nenhum I/O.

## Fase 3 — Infrastructure + Api
- [x] **T030 API** Fixture de integração: `WebApplicationFactory` + Testcontainers Postgres (um container por coleção, reset entre testes).
- [x] **T031 API** 🔴 `DrawRepository`: round-trip de um `Draw` completo (VOs, arrays e ordem dos ganhadores preservados); `DeleteExpiredBeforeAsync`. 🟢 `DrawConfiguration` conforme [data-model.md](data-model.md) + migração `InitialDraws` + `MigrateAsync` no startup.
- [x] **T032 API [P]** 🔴🟢 `CryptoRandomSource` (limites; nunca fora de `[0, max)`).
- [x] **T033 API** 🔴 `POST /api/v1/draws` conforme [contracts/api.md](contracts/api.md): 201 + `Location`; 400 com `errors` por campo; corpo > 3 MB → 413. 🟢 Endpoint + `ResultExtensions` + registrar os handlers da Application (`AddApplication`) junto com os adaptadores — a factory de integração valida o DI (`ValidateOnBuild`), então registro faltando quebra os testes.
- [x] **T034 API** 🔴 `GET /api/v1/draws/{publicId}`: 200 idêntico em duas leituras; 404; 410; `publicId` malformado → 404. 🟢 Endpoint. *(US5.3)*
- [x] **T035 API** 🔴🟢 Rate limit de 10/min por IP no `POST` → 429 com ProblemDetails, usando `X-Forwarded-For`. *(FR-013)*
- [x] **T036 API** 🔴🟢 `ExpiredDrawsPurgeJob` chama o handler (teste com intervalo curto). *(FR-011)*

**Checkpoint:** `dotnet test` todo verde; `/openapi/v1.json` coerente com o contrato. ✅ 132 testes; OpenAPI declara 201/400/413/429 e 200/404/410.

## Fase 4 — Domínio do client (Vitest) — pode rodar em paralelo às Fases 1–3
- [x] **T040 APP [P]** 🔴 `participants.ts` com o mesmo `normalization-cases.json`. 🟢 Implementar. *(FR-003, FR-004)*
- [x] **T041 APP [P]** 🔴 `pick-winners.ts`: mesmos cenários da T016 (fonte aleatória injetável). 🟢 Floyd + Fisher–Yates com `crypto.getRandomValues` + rejection sampling.
- [x] **T042 APP [P]** 🔴 `parse-file.ts`: TXT (CRLF/LF, BOM); CSV `,`/`;`, aspas, cabeçalho, escolha de coluna; > 1 MB, > 10.000 linhas e extensão inválida. 🟢 Implementar sobre o `papaparse`. *(FR-002, US3)*
- [x] **T043 APP** 🔴🟢 `draw.models.ts` + `draw-api.ts` (`HttpTestingController`): mapeamento de 201/200/400/404/410/429.

## Fase 5 — UI do client — ✅ desbloqueada (ADR 0001 aceito) ([004](../004-design-system/spec.md))
- [x] **T050 APP** 🔴🟢 `participants-input`: abas Lista/Intervalo, validação do intervalo, contador "X entradas · Y elegíveis". *(US1, US2, US4.3)*
- [x] **T051 APP** 🔴🟢 `file-import`: importar, seletor de coluna/cabeçalho para CSV, textarea editável após importar. *(US3)*
- [x] **T052 APP** 🔴🟢 `draw-settings`: título, ganhadores (limitado aos elegíveis), duplicados, exibir participantes. *(FR-004, FR-005, FR-009)*
- [x] **T053 APP** 🔴🟢 `draw-result` + sorteio rápido: animação ≤ 3 s (instantânea com `prefers-reduced-motion`), `aria-live`, "sortear novamente". *(FR-007, FR-008)*
- [x] **T054 APP** 🔴🟢 "Sortear e salvar": diálogo explicando o sorteio oficial → `POST` → link + "copiar link"; tratamento de 400/429. *(US5.1, FR-012)*
- [x] **T055 APP** 🔴🟢 `shared-draw-page`: dados, participantes (se houver), estados de carregando/404/410. *(US5.2–5.4)*
- [x] **T056 APP** Revisão de responsividade (360 px+) nos dois temas + axe-core sem violações sérias.

## Fase 6 — E2E e implantação
- [x] **T060 APP** Playwright: (a) lista → sorteio rápido → resultado (US1); (b) importar TXT → sortear e salvar → abrir o link → mesmo resultado em dois acessos (US3 + US5); (c) os dois temas no viewport mobile.
- [x] **T061 APP** `boasorte-app/Dockerfile` (`node:24` → `nginx:alpine`) + `nginx.conf` (fallback de SPA, cache, HSTS/CSP); `docker build` local OK.
- [x] **T062 API** `Dockerfile` da raiz validado (só a 8080, usuário não-root); variáveis de ambiente documentadas.
- [ ] **T063 OPS** _(runbook pronto em [deploy/README.md](../../deploy/README.md); execução no painel do Dokploy pelo usuário)_ Dokploy: Database Postgres; Applications `web`/`api` (GitHub, build path/Dockerfile); domínios `boasorte.app` (`/` e `/api`, sem strip path, Let's Encrypt) + redirect de `www`; variáveis de ambiente; health check; auto-deploy.
- [x] **T064 OPS** `deploy/backup/pg-backup.sh` + `pg-restore.sh` + cron no host (diário, 7 diários + 4 semanais, log, código de saída); passo off-site opcional; restore testado uma vez e documentado em `deploy/README.md`.
- [ ] **T065 OPS** _(checklist em [deploy/README.md](../../deploy/README.md#6-primeiro-deploy--checklist-t065))_ Primeiro deploy + e2e (a) contra `https://boasorte.app`; conferir no log que o rate limit enxerga o IP real.

**Checkpoint final:** todos os critérios de aceite da spec cobertos por testes; critérios de sucesso medidos (sorteio de 10.000 em < 1 s).
