# 001 — Plano técnico: Sorteio por lista

**Spec:** [spec.md](spec.md) · **Modelo:** [data-model.md](data-model.md) · **Contrato:** [contracts/api.md](contracts/api.md) · **Tasks:** [tasks.md](tasks.md)

## Decisões de arquitetura

| Tema | Decisão | Motivo |
|------|---------|--------|
| Banco | PostgreSQL 17 + EF Core (Npgsql) | Decisão do usuário. Arrays nativos (`text[]`) guardam participantes e ganhadores sem tabelas extras. |
| Hospedagem | VPS com **Dokploy**: duas *Applications* (`web`, `api`) com deploy por Dockerfile a partir do Git + um *Database* PostgreSQL do Dokploy | Decisão do usuário. O Dokploy já entrega Traefik com TLS (Let's Encrypt), backups do banco e deploy automático. |
| Origem única | O mesmo domínio em ambas as Applications: `web` em `/` e `api` em `/api` (roteamento por path no Traefik, **sem** strip path) | Sem CORS em produção e cookies first-party, o que simplifica a sessão OAuth da 002. |
| Dev local | Postgres via `docker compose`; API com `dotnet run`; Angular com `ng serve` + `proxy.conf.json` (`/api` → API) | Mesma topologia de URL de produção. |
| Aleatoriedade | API: `RandomNumberGenerator.GetInt32`. App: `crypto.getRandomValues` com rejection sampling. | Constituição §1. Sem viés de módulo. |
| Algoritmo | Fisher–Yates parcial (k primeiros) para listas; amostragem com rejeição + `HashSet` para intervalos | O(k) e não precisa materializar intervalos grandes. |
| ID público | 12 caracteres base62 gerados por CSPRNG (~71 bits) | Não adivinhável (US5.1) e mais curto que um GUID na URL. |
| Validação | Validação nativa do .NET 10 (`AddValidation`) + regras de domínio, com erros em `ProblemDetails` (RFC 9457) | Formato de erro padronizado para o app. |
| Migrações | Aplicadas na inicialização da API (`MigrateAsync`) | Instância única na VPS; simples. Revisar se houver mais de uma réplica. |
| Rate limit | `Microsoft.AspNetCore.RateLimiting`, janela fixa por IP no `POST` (10/min) | Protege o banco contra abuso (FR-013). Exige `ForwardedHeaders` confiando no Traefik (rede interna do Docker), senão todos os clientes aparecem com o IP do proxy. |
| Expiração | `GET` devolve `410` se `expires_at < now`; `BackgroundService` diário apaga expirados há mais de 30 dias | FR-011. Após a purga, `404`; o app mostra a mesma tela "não encontrado ou expirado". |
| Parse de CSV | `papaparse` no navegador (detecta `,`/`;`, aspas, BOM) | Evita escrever um parser de CSV com casos de borda. |
| Testes API | xUnit v3; integração com `WebApplicationFactory` + Testcontainers (Postgres real) | Testa o SQL real (arrays, índices), sem mocks do EF. |
| Testes App | Jasmine/Karma (já configurados) para domínio e componentes; Playwright para os fluxos US1 e US5 | Mantém o scaffold atual; o e2e cobre os critérios de aceite de ponta a ponta. |

## Regras de domínio (iguais no app e na API)

As regras rodam nos dois lados: no app, para o sorteio rápido e o contador de elegíveis; na API, para o sorteio oficial. Para que não divirjam, **os dois conjuntos de testes consomem o mesmo arquivo de casos**: [contracts/normalization-cases.json](contracts/normalization-cases.json).

1. **Normalizar** (FR-003): `trim()` em cada entrada; descartar vazias; entradas acima de 200 caracteres são erro de validação.
2. **Deduplicar** (FR-004, opcional): a chave é `trim` + minúsculas (cultura invariante). Mantém a **primeira** ocorrência com a grafia original.
3. **Sortear** (FR-006): k ganhadores distintos, em ordem, com `1 ≤ k ≤ min(elegíveis, 1000)`.
4. **Intervalo**: `-1.000.000.000 ≤ início ≤ fim ≤ 1.000.000.000`; os elegíveis são `fim - início + 1`; a lista nunca é materializada.

## Estrutura — API (`boasorte-api`)

```
boasorte-api/                    (raiz do repo)
├── boasorte-api.slnx            ← movido para a raiz
├── boasorte-api/
│   ├── Program.cs               composição: DbContext, validação, rate limit, endpoints
│   ├── Domain/Draws/
│   │   ├── ParticipantRules.cs  normalizar/deduplicar (puro)
│   │   ├── WinnerPicker.cs      sorteio de lista e de intervalo (puro, recebe IRandomSource)
│   │   └── PublicId.cs
│   ├── Features/Draws/
│   │   ├── DrawEndpoints.cs     POST /api/v1/draws, GET /api/v1/draws/{publicId}
│   │   └── DrawContracts.cs     requests/responses (records)
│   └── Infrastructure/
│       ├── AppDbContext.cs, DrawEntity + configuração
│       ├── Migrations/
│       └── ExpiredDrawsPurger.cs
└── boasorte-api.Tests/
    ├── Domain/                  unitários (inclui os casos compartilhados de normalização)
    └── Integration/             WebApplicationFactory + Testcontainers
```

`IRandomSource` existe só para que os testes controlem a sequência sorteada. Em produção há uma única implementação sobre `RandomNumberGenerator`.

## Estrutura — App (`boasorte-app`)

```
src/app/
├── app.routes.ts                '' → home provisória (até a 003), 'sorteio/lista', 's/:publicId'
├── core/api/                    draw-api.ts (HttpClient), draw.models.ts (tipos do contrato)
└── features/
    ├── list-draw/
    │   ├── domain/              participants.ts, pick-winners.ts, parse-file.ts (+ .spec.ts)
    │   ├── list-draw-page.ts    estado com signals: entradas → elegíveis (computed) → resultado
    │   ├── participants-input/  abas "Lista" | "Intervalo" + importar arquivo
    │   ├── file-import/         seleção de coluna/cabeçalho para CSV
    │   ├── draw-settings/       ganhadores, duplicados, título, exibir participantes
    │   └── draw-result/         animação (≤ 3 s, respeita prefers-reduced-motion) + ganhadores
    └── shared-draw/
        └── shared-draw-page.ts  resultado público; estados 404/410
```

Convenções: componentes standalone, `ChangeDetectionStrategy.OnPush`, signals, `inject()` e nomes de arquivo no estilo do Angular 20 (sem sufixo `.component`).

## Fluxo

```
[Navegador]                                   [API]                     [Postgres]
 lista/intervalo ──normalize/dedup──▶ contador de elegíveis
 "Sortear"         ──pickWinners (crypto)──▶ resultado local (repetível)
 "Sortear e salvar" ── POST /api/v1/draws ──▶ valida, normaliza, sorteia ──▶ INSERT
                   ◀── 201 { publicId, ... } ─┘
 /s/{publicId}     ── GET /api/v1/draws/{id} ─▶ SELECT ─▶ 200 | 404 | 410
```

O botão "Sortear e salvar" faz um sorteio **novo** no servidor: o resultado salvo pode ser diferente do último sorteio rápido. A UI avisa isso antes de confirmar (spec FR-012).

## Implantação (VPS + Dokploy)

```
Traefik (Dokploy, TLS)
 ├── boasorte.<domínio>/      → Application "web"  (repo boasorte-app,  Dockerfile em boasorte-app/Dockerfile)  nginx:80
 └── boasorte.<domínio>/api   → Application "api"  (repo boasorte-api,  Dockerfile em boasorte-api/Dockerfile)  :8080
                                   └── Database "postgres" (Dokploy, rede interna, backup diário para S3)
```

| Item | Onde | Observação |
|------|------|------------|
| Web | `boasorte-app/Dockerfile` | Multi-stage: `node:24` faz o `ng build` e o `nginx:alpine` serve o `dist/` com fallback de SPA (`try_files … /index.html`), cache longo para assets com hash e headers de segurança. |
| API | `boasorte-api/boasorte-api/Dockerfile` | Já existe; ajustar para expor só a 8080 (o TLS termina no Traefik). |
| Banco | Database PostgreSQL do Dokploy | Connection string pela variável de ambiente `ConnectionStrings__Default` da Application `api`, usando o host interno que o Dokploy mostra. Sem porta pública. |
| Backup | Backups do Dokploy → destino S3 (ex.: Backblaze B2, Cloudflare R2) | Diário, retenção de 7 dias. Testar o restore uma vez. |
| Segredos | Aba *Environment* de cada Application | Nada de `.env` no git. |
| Deploy | Auto-deploy por push na `main` (webhook do GitHub) | Uma Application por repo. |
| Health | `GET /api/health` | Configurado como health check da Application `api` (o Dokploy usa Docker Swarm e só troca o container quando o novo estiver saudável). |

- A API não faz HTTPS próprio: `UseHttpsRedirection` sai e `ForwardedHeaders` (`X-Forwarded-For`/`-Proto`) é ligado, limpando `KnownNetworks`/`KnownProxies`, porque o IP do Traefik muda.
- **Roteamento por path:** o domínio da `api` usa path `/api` **sem** *Strip Path*; as rotas da API já começam com `/api`. O Traefik prioriza a regra mais específica, então `/api/*` não cai no nginx.
- **Dev local:** `deploy/docker-compose.dev.yml` sobe só o Postgres. Não há compose de produção, porque o Dokploy cumpre esse papel.

## Verificação da constituição

| Princípio | Atendido por |
|-----------|--------------|
| §1 Justo e auditável | CSPRNG nos dois lados; sorteio oficial só no servidor; registro imutável (sem endpoint de update/delete) com config, elegíveis, data e resultado. |
| §2 Spec antes de código | Cada task referencia FR/US; os limites novos (200 caracteres, 1000 ganhadores, intervalo, rate limit) foram adicionados à spec. |
| §3 Testes guiam | Fase de domínio em TDD; casos de normalização compartilhados; integração com Postgres real; e2e dos critérios de aceite. |
| §4 Fronteira app/API | Só via [contracts/api.md](contracts/api.md), versionado em `/api/v1`. |
| §5 Privacidade | `show_participants` respeitado na resposta; retenção de 12 meses + purga. |
| §6 Simplicidade | Um único projeto de API com pastas por feature; sem repositórios genéricos nem CQRS. |

## Riscos

- **Divergência entre normalização no app e na API:** mitigada pelo arquivo de casos compartilhado.
- **Payload grande (10.000 × 200 caracteres ≈ 2 MB):** limite de corpo de 3 MB no endpoint de criação.
- **Uma única VPS:** sem alta disponibilidade. Aceitável para o MVP, com backup diário do Dokploy para S3 (fora da VPS).
- **`MigrateAsync` no startup com rolling update do Swarm:** por um instante, o container antigo roda contra o schema novo. Migrações precisam ser compatíveis com a versão anterior (só adicionar; remoções em dois deploys).
