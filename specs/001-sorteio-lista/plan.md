# 001 — Plano técnico: Sorteio por lista

**Spec:** [spec.md](spec.md) · **Modelo:** [data-model.md](data-model.md) · **Contrato:** [contracts/api.md](contracts/api.md) · **Tasks:** [tasks.md](tasks.md)
**Depende de:** [004 — Design system](../004-design-system/spec.md) (somente a UI, Fase 5 das tasks)

## Decisões de arquitetura

| Tema | Decisão | Motivo |
|------|---------|--------|
| Arquitetura da API | Clean Architecture em 4 projetos (Domain, Application, Infrastructure, Api), com a regra de dependência verificada por testes de arquitetura | Constituição §4 |
| Banco | PostgreSQL 18 + EF Core (Npgsql) | Decisão do usuário. Arrays nativos (`text[]`) guardam participantes e ganhadores sem tabelas extras. |
| Hospedagem | VPS com **Dokploy**: Applications `web` e `api` (Dockerfile a partir do Git) + Database PostgreSQL do Dokploy | Decisão do usuário. O Traefik do Dokploy cuida do TLS e do roteamento. |
| Domínio | `boasorte.app`: `web` em `/` e `api` em `/api` (sem strip path); `www.boasorte.app` redireciona para o apex | Origem única: sem CORS e com cookies first-party (importante para o OAuth da 002). O TLD `.app` exige HTTPS (HSTS preload), o que o Traefik já garante. |
| Backup | Script próprio na VPS (cron) com `pg_dump` | Decisão do usuário. Ver *Implantação*. |
| Dev local | Postgres via `docker compose`; API com `dotnet run`; Angular com `ng serve` + `proxy.conf.json` | Mesma topologia de URL de produção. |
| Aleatoriedade | API: `RandomNumberGenerator.GetInt32` atrás da porta `IRandomSource`. Client: `crypto.getRandomValues` com rejection sampling. | Constituição §1. Sem viés de módulo. |
| Algoritmo | **Um único algoritmo** para lista e intervalo: amostragem de Floyd (k índices distintos em `[0, n)`, O(k)) + Fisher–Yates sobre os k para definir a ordem | Não precisa materializar intervalos grandes; a mesma lógica serve aos dois tipos. |
| ID público | VO `PublicId`: 12 caracteres base62 (~71 bits), gerado com `IRandomSource` | Não adivinhável (US5.1) e curto na URL. |
| Erros | Domínio/Application retornam `Result<T>` com `Error(code, message, field?)`; a Api mapeia para `ProblemDetails` (400/404/410) | Erros esperados não são exceções (constituição §4). |
| Migrações | `MigrateAsync` no startup da Api; migrações sempre compatíveis com a versão anterior | Instância única; durante o rolling update do Swarm, o container antigo convive com o schema novo. |
| Rate limit | `Microsoft.AspNetCore.RateLimiting`, janela fixa por IP no `POST` (10/min) | FR-013. Exige `ForwardedHeaders` confiando no Traefik. |
| Expiração | O caso de uso `GetDraw` retorna `Expired` → 410; o caso de uso `PurgeExpiredDraws`, disparado diariamente por um `BackgroundService`, apaga expirados há mais de 30 dias | FR-011 |
| Client | Angular 22 (atualizado do scaffold 20); **Vitest** via `ng test`; Playwright para e2e | Constituição §5 |
| CSV no client | `papaparse` (detecta `,`/`;`, aspas, BOM) | Evita escrever um parser de CSV com casos de borda. |

## API — camadas e responsabilidades

### Domain (`BoaSorte.Domain`), sem dependências externas

**Value objects** (records imutáveis, construtor privado, `Create(...) → Result<T>`):

| VO | Invariantes |
|----|-------------|
| `PublicId` | 12 caracteres `[0-9A-Za-z]`; `PublicId.New(IRandomSource)` e `PublicId.Parse(string)` |
| `DrawTitle` | opcional; após trim, 1–120 caracteres |
| `Participant` | após trim, 1–200 caracteres; expõe `DedupKey` (minúsculas, cultura invariante) |
| `NumberRange` | `Start ≤ End`, ambos em ±1.000.000.000; `Count` (long) |
| `WinnersCount` | 1–1000 (a comparação com os elegíveis acontece no agregado) |
| `Winner` | `Position` (≥1) + `Value` |
| `DrawSettings` | `RemoveDuplicates`, `ShowParticipants`, `WinnersCount` |

**Pool de participantes** (polimorfismo no lugar de `switch` por tipo — O/L do SOLID):
- `IParticipantPool { long Count; string ValueAt(long index); }`
- `ListPool.From(IEnumerable<string> raw, bool removeDuplicates)`: aplica as regras de normalização (FR-003/FR-004) e guarda os `Participant` elegíveis + o `SubmittedCount`.
- `RangePool(NumberRange)`: `ValueAt(i) = Start + i`, sem materializar.

**Serviço de domínio:** `WinnerSampler.Sample(long n, int k, IRandomSource) → IReadOnlyList<long>` (Floyd + embaralhamento dos k).

**Agregado `Draw`:**
- `Draw.Conduct(DrawTitle?, IParticipantPool, DrawSettings, IRandomSource, DateTimeOffset now) → Result<Draw>` valida `k ≤ elegíveis`, sorteia, gera o `PublicId` e define `ExpiresAt = now + 12 meses`.
- `bool IsExpiredAt(DateTimeOffset now)`.
- Sem setters públicos; um construtor privado para o EF.

**Porta do domínio:** `IRandomSource { int NextInt(int maxExclusive); long NextLong(long maxExclusive); }`. Fica no Domain porque o algoritmo de sorteio é regra de negócio e precisa dela.

### Application (`BoaSorte.Application`) → depende de Domain

| Caso de uso | Entrada → Saída | Erros |
|-------------|-----------------|-------|
| `CreateDrawHandler` | `CreateDrawCommand` → `DrawDetails` | validação (por campo) |
| `GetDrawHandler` | `GetDrawQuery(publicId)` → `DrawDetails` | `NotFound`, `Expired` |
| `PurgeExpiredDrawsHandler` | `cutoff` → nº de removidos | — |

- Portas: `IDrawRepository` (`AddAsync`, `GetByPublicIdAsync`, `DeleteExpiredBeforeAsync`).
- `TimeProvider` injetado; `DrawDetails` respeita `ShowParticipants` (privacidade decidida aqui, não no endpoint).
- `AddApplication()` registra os handlers.

### Infrastructure (`BoaSorte.Infrastructure`) → depende de Application e Domain
- `AppDbContext` + `DrawConfiguration`: VOs mapeados por `ValueConverter`/`ComplexProperty`; `Participant[]` e `Winner[]` como `text[]` (a posição é o índice).
- `DrawRepository`, `CryptoRandomSource`, `ExpiredDrawsPurgeJob` (`BackgroundService` que chama o handler).
- `AddInfrastructure(IConfiguration)`.

### Api (`BoaSorte.Api`) → depende de Application e Infrastructure (só para a composição)
- `DrawEndpoints`: request HTTP → command → handler → `Result` → `IResult` (201/200/400/404/410).
- `ResultExtensions.ToProblem()`, `AddProblemDetails`, validação de forma (tipos/obrigatórios), rate limit, `ForwardedHeaders`, health check (`/api/health` com o banco), OpenAPI.

### Estrutura do repositório

```
boasorte-api/
├── BoaSorte.slnx
├── Directory.Build.props         net10.0, Nullable, TreatWarningsAsErrors, ImplicitUsings
├── Directory.Packages.props      versões centralizadas (Central Package Management)
├── Dockerfile                    build multi-projeto (contexto = raiz)
├── src/
│   ├── BoaSorte.Domain/          Common/ (Result, Error)  Draws/ (Draw, VOs, pools, WinnerSampler, DrawErrors)
│   ├── BoaSorte.Application/     Abstractions/  Draws/CreateDraw/  Draws/GetDraw/  Draws/PurgeExpired/
│   ├── BoaSorte.Infrastructure/  Persistence/ (DbContext, Configurations, Migrations, Repositories)  Random/  Jobs/
│   └── BoaSorte.Api/             Program.cs  Endpoints/  Contracts/  Http/ (ResultExtensions)
└── tests/
    ├── BoaSorte.Domain.Tests/          unitários puros (inclui normalization-cases.json)
    ├── BoaSorte.Application.Tests/     handlers com fakes (repositório em memória, FakeTimeProvider, random determinístico)
    ├── BoaSorte.Api.IntegrationTests/  WebApplicationFactory + Testcontainers (Postgres real)
    └── BoaSorte.Architecture.Tests/    NetArchTest: regra de dependência entre camadas
```

**Pirâmide de testes:** a maioria no Domain (rápidos e puros), handlers na Application com fakes nas portas e poucos testes de integração cobrindo o contrato HTTP + SQL real.

## Regras de domínio (iguais no client e na API)

1. **Normalizar** (FR-003): `trim()`; descartar vazias; > 200 caracteres = erro de validação.
2. **Deduplicar** (FR-004, opcional): a chave é `trim` + minúsculas (invariante); mantém a **primeira** ocorrência; acentos são distintos.
3. **Sortear** (FR-006): k distintos, em ordem, `1 ≤ k ≤ min(elegíveis, 1000)`.
4. **Intervalo**: ±1.000.000.000, `start ≤ end`.

Os dois lados testam contra o mesmo arquivo: [contracts/normalization-cases.json](contracts/normalization-cases.json).

## Client

```
boasorte-app/src/
├── index.html                    script inline anti-flash de tema (004)
├── styles/                       tokens (004), temas, tipografia
└── app/
    ├── app.routes.ts             ''(003) · 'sorteio/lista' · 's/:publicId'
    ├── core/
    │   ├── api/                  draw-api.ts, draw.models.ts (tipos do contrato)
    │   ├── theme/                theme.service.ts (004)
    │   └── layout/               shell: header, footer
    └── features/
        ├── list-draw/
        │   ├── domain/           participants.ts · pick-winners.ts · parse-file.ts  (+ .spec.ts, Vitest)
        │   ├── list-draw-page.ts estado em signals: entradas → elegíveis (computed) → resultado
        │   ├── participants-input/ · file-import/ · draw-settings/ · draw-result/
        └── shared-draw/
            └── shared-draw-page.ts
```

- Componentes standalone, `OnPush`, signals, `inject()`, nomes de arquivo no estilo Angular 20+.
- Os componentes visuais usam a biblioteca escolhida no ADR 0001. As pastas `domain/` não dependem dela e podem ser feitas antes.

## Fluxo

```
[Navegador]                                    [API]                                    [Postgres]
 lista/intervalo ──normalize/dedup──▶ contador de elegíveis
 "Sortear"          ──pickWinners (crypto)──▶ resultado local (repetível)
 "Sortear e salvar" ── POST /api/v1/draws ──▶ Api → CreateDrawHandler → Draw.Conduct ─▶ INSERT
                    ◀── 201 { publicId, … } ──┘
 /s/{publicId}      ── GET /api/v1/draws/{id} ─▶ Api → GetDrawHandler ─────────────────▶ SELECT
                    ◀── 200 | 404 | 410 ──────┘
```

O "Sortear e salvar" é um sorteio **novo** no servidor; a UI avisa antes de confirmar (FR-012).

## Implantação (VPS + Dokploy)

```
Traefik (Dokploy, TLS Let's Encrypt)
 ├── boasorte.app/      → Application "web" (repo boasorte-app, boasorte-app/Dockerfile) nginx:80
 ├── boasorte.app/api   → Application "api" (repo boasorte-api, Dockerfile na raiz)     :8080
 │                            └── Database "postgres" (Dokploy, rede interna)
 └── www.boasorte.app   → redirect 301 para boasorte.app
```

| Item | Detalhe |
|------|---------|
| Web | Multi-stage `node:24` → `nginx:alpine`; fallback de SPA, cache longo para assets com hash, HSTS/CSP. |
| API | Expõe só a 8080; `ConnectionStrings__Default` e `ASPNETCORE_ENVIRONMENT` na aba *Environment* do Dokploy. |
| Health | `GET /api/health` como health check da Application `api`. |
| Deploy | Auto-deploy por push na `main` (webhook do GitHub). |
| Proxy | `ForwardedHeaders` com `KnownNetworks`/`KnownProxies` limpos (o IP do Traefik muda). |

### Backup (script próprio na VPS)
- `deploy/backup/pg-backup.sh`, agendado via cron no host (diário, 03:00).
- Localiza o container do Postgres do Dokploy e roda `pg_dump -Fc` via `docker exec`. Grava em `/var/backups/boasorte/` com data no nome.
- Retenção: 7 diários + 4 semanais. Registra em log e sai com código ≠ 0 em caso de falha.
- `deploy/backup/pg-restore.sh` + procedimento em `deploy/README.md`, testado uma vez antes do go-live.

## Verificação da constituição

| Princípio | Atendido por |
|-----------|--------------|
| §1 Justo e auditável | CSPRNG; sorteio oficial só no servidor (`Draw.Conduct`); agregado imutável; sem endpoint de update/delete. |
| §2 Spec antes de código | Tasks referenciam FR/US; limites registrados na spec; ADR para a biblioteca de UI. |
| §3 TDD | Toda task de implementação é precedida pela de teste; casos de normalização compartilhados. |
| §4 Clean Architecture | 4 projetos + testes de arquitetura; VOs com invariantes; `Result`; `TimeProvider`; portas só nas fronteiras reais (repositório, aleatoriedade). |
| §5 Client | Vitest, Playwright, temas/tokens/responsividade via 004. |
| §6 Fronteira | Contrato `/api/v1` em [contracts/api.md](contracts/api.md). |
| §7 Privacidade | `ShowParticipants` aplicado na Application; retenção de 12 meses + purga. |
| §8 Simplicidade | Sem MediatR/AutoMapper; um algoritmo de sorteio só; pools no lugar de hierarquias de entidades. |

## Riscos
- **Divergência de normalização entre client e API:** mitigada pelo arquivo de casos compartilhado.
- **Payload grande (10.000 × 200 caracteres ≈ 2 MB):** limite de corpo de 3 MB no endpoint de criação.
- **Backups na mesma VPS:** se a VPS for perdida, os backups vão junto. Recomendação: depois, adicionar ao script uma cópia off-site (ex.: `rclone` para um bucket). O script já deve deixar esse passo como opcional.
- **Migrações no startup + rolling update:** só migrações compatíveis com a versão anterior (remoções em dois deploys).
- **Atualização 20 → 22 do Angular:** feita com o projeto vazio, sem custo relevante agora.
