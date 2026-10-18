# Implantação — boasorte.app (VPS + Dokploy)

Plano de referência: [specs/001-sorteio-lista/plan.md](../specs/001-sorteio-lista/plan.md#implantação-vps--dokploy).

```
Traefik (Dokploy, TLS Let's Encrypt)
 ├── boasorte.app/       → Application "web" (repo boasorte-app, build path boasorte-app/)  nginx :80
 ├── boasorte.app/api    → Application "api" (repo boasorte-api, raiz)                       :8080
 │                             └── Database "postgres" (Dokploy, rede interna)
 └── www.boasorte.app    → redirect 301 para boasorte.app
```

## 0. Ensaio local (antes de qualquer deploy)

Mesmas imagens e mesmo roteamento por path, com Traefik:

```bash
docker compose -f deploy/docker-compose.local.yml up -d --build
cd boasorte-app && E2E_BASE_URL=http://localhost:8088 npm run e2e
docker compose -f deploy/docker-compose.local.yml down -v
```

## 1. Pré-requisitos

- [ ] DNS: registros `A` (e `AAAA`, se houver IPv6) de `boasorte.app` e `www.boasorte.app` apontando para a VPS.
- [ ] Firewall: apenas 22, 80 e 443 abertos.
- [ ] Os dois repositórios no GitHub, conectados ao Dokploy (provider GitHub).
- [ ] **Versão do Traefik ≥ 3.6 se o Docker da VPS for ≥ 29.** Versões anteriores falham ao falar com a API do Docker 29 ("API returned a 400"), e nenhuma rota funciona. Confira com `docker version` e a imagem do Traefik do Dokploy.

## 2. Banco (Dokploy → Create Service → Database → PostgreSQL)

| Campo | Valor |
|---|---|
| Nome | `boasorte-postgres` (é o `CONTAINER_FILTER` do backup) |
| Imagem | `postgres:18` |
| Usuário / banco | `boasorte` / `boasorte` |
| Senha | gerada pelo Dokploy (não reutilize) |
| Porta externa | **nenhuma** (acesso só pela rede interna) |

Anote o **host interno** mostrado nas credenciais internas do banco.

## 3. API (Create Service → Application)

| Campo | Valor |
|---|---|
| Repositório / branch | `boasorte-api` / `main` |
| Build type | Dockerfile — path `Dockerfile`, contexto `/` (raiz) |
| Porta do container | `8080` |
| Variáveis (*Environment*) | `ASPNETCORE_ENVIRONMENT=Production`<br>`ConnectionStrings__Default=Host=<host interno>;Port=5432;Database=boasorte;Username=boasorte;Password=<senha>` |
| Domínio | host `boasorte.app`, **path `/api`**, *Strip Path* **desligado**, HTTPS com Let's Encrypt |
| Health check | já embutido na imagem (`HEALTHCHECK` → `GET /api/health`, inclui o banco) |
| Auto deploy | ligado (push na `main`) |

As migrações rodam na inicialização. Por isso, toda migração precisa ser compatível com a versão anterior (veja o plano).

## 4. Web (Create Service → Application)

A imagem é gerada no GitHub Actions ([.github/workflows/web.yml](../.github/workflows/web.yml)), não na VPS. O build do Angular chegava perto de 2 GB e o kernel o matava por falta de memória, o que o Dokploy mostrava como deploy cancelado. A cada push na `main` que toca `boasorte-app/`, o workflow roda os testes, publica `ghcr.io/flvrm92/boasorte-web:latest` (e `:sha-<commit>`) e chama a API do Dokploy para fazer o deploy.

| Campo | Valor |
|---|---|
| Provider | **Docker** — imagem `ghcr.io/flvrm92/boasorte-web:latest` |
| Registry | se o pacote no GHCR for privado: registry `ghcr.io`, usuário do GitHub e um PAT *classic* só com `read:packages`. Se for público (é só o front estático), deixe em branco |
| Porta do container | `80` |
| Domínios | `boasorte.app` path `/` (HTTPS, Let's Encrypt) e `www.boasorte.app` com redirect permanente para `https://boasorte.app` |
| Auto deploy | quem dispara é o workflow (não há mais build por Git no Dokploy) |

Secrets do repositório no GitHub (*Settings → Secrets and variables → Actions*). O job `deploy` usa o environment `production`:

| Secret | Valor |
|---|---|
| `DOKPLOY_URL` | URL do painel, ex.: `https://dokploy.boasorte.app` (sem `/` no final) |
| `DOKPLOY_API_KEY` | Dokploy → *Profile → API/CLI* → gerar token |
| `DOKPLOY_WEB_APPLICATION_ID` | o ID da Application `web` (aparece na URL do painel: `.../application/<id>`) |

Rollback: troque a imagem da Application para `ghcr.io/flvrm92/boasorte-web:sha-<commit>` e faça o deploy no painel.

O Traefik escolhe a regra mais específica, então `/api/*` vai para a API mesmo com a web em `/`.

O Traefik só roteia para containers **saudáveis**: logo após um deploy, há alguns segundos de 404 até o health check passar. Espere o status *healthy* antes dos testes.

A web é gerada como arquivos estáticos: `/`, `/termos` e `/privacidade` são prerenderizadas, e as demais rotas usam `index.csr.html` (veja `boasorte-app/nginx.conf`). `/s/*` recebe `X-Robots-Tag: noindex`.

## 5. Backup (no host da VPS, fora do Dokploy)

```bash
sudo mkdir -p /opt/boasorte/backup
sudo cp deploy/backup/pg-backup.sh deploy/backup/pg-restore.sh /opt/boasorte/backup/
sudo chmod 750 /opt/boasorte/backup/*.sh
sudo cp deploy/backup/boasorte-backup.cron /etc/cron.d/boasorte-backup   # ajuste CONTAINER_FILTER se preciso
sudo CONTAINER_FILTER=boasorte-postgres /opt/boasorte/backup/pg-backup.sh  # primeira execução manual
```

- Dumps em `/var/backups/boasorte/{daily,weekly}`: 7 diários + 4 semanais (domingos). Log em `/var/log/boasorte-backup.log`.
- **Risco:** os backups ficam na mesma VPS. Para uma cópia externa, instale e configure o `rclone` e acrescente `RCLONE_REMOTE=<remote>:<bucket>` na linha do cron.

### Restore

1. Pare a Application `api` no Dokploy.
2. `sudo CONTAINER_FILTER=boasorte-postgres /opt/boasorte/backup/pg-restore.sh /var/backups/boasorte/daily/<arquivo>.dump` (pede confirmação digitando `restore`).
3. Inicie a `api` e abra um link de resultado conhecido.

Ensaio feito em 2026-10-12, no ambiente local: backup → apagar tudo → restore → o mesmo `GET /api/v1/draws/{id}` devolveu JSON idêntico.

## 6. Primeiro deploy — checklist (T065)

- [ ] **Dados legais completos:** `cd boasorte-app && npm run check:legal` passa (razão social e CNPJ em `src/app/features/legal/legal-entity.ts`)
- [ ] **Termos e política revisados por um advogado** (pré-requisito do App Review da Meta)
- [ ] Caixa de e-mail `contato@boasorte.app` criada e recebendo
- [ ] Retenção dos logs de acesso do Traefik/Dokploy ≤ 30 dias (a política de privacidade promete isso)

- [x] `https://boasorte.app/api/health` → `Healthy`
- [ ] `https://www.boasorte.app` redireciona para `https://boasorte.app`
- [ ] Headers na home: `Content-Security-Policy`, `X-Frame-Options: DENY`, `Strict-Transport-Security` (enviado pelo nginx da imagem `web`: o Traefik do Dokploy não adiciona por padrão; o TLD `.app` já é HSTS-preload)
- [x] `cd boasorte-app && E2E_BASE_URL=https://boasorte.app npx playwright test e2e/list-draw.e2e.ts e2e/landing.e2e.ts e2e/smoke.e2e.ts`
  - cria 2 sorteios reais (de teste) no banco de produção
- [ ] Rate limit enxerga o IP real: 11 `POST` seguidos do mesmo IP → o 11º recebe 429 (comportamento validado no ensaio local, inclusive contra `X-Forwarded-For` forjado)
- [ ] Primeiro backup manual gerado e listado com `pg_restore --list`
