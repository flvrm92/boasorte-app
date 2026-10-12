# Constituição — BoaSorte

Princípios que valem para todas as features. Um `plan.md` que viole algum deles precisa justificar a exceção explicitamente.

## 1. Sorteio justo e auditável
- A aleatoriedade usa um gerador criptograficamente seguro (nunca `Math.random()` / `System.Random`).
- Todo sorteio registra: participantes elegíveis (após filtros), configuração aplicada, data/hora (UTC) e resultado.
- Um resultado salvo/compartilhado é **imutável**: quem abre o link vê exatamente o mesmo resultado, e não um novo sorteio.

## 2. Spec antes de código
- Todo requisito implementado rastreia para um `FR-xxx` de uma spec.
- Mudança de comportamento começa alterando a spec, depois o código.

## 3. Testes guiam a implementação
- Regras de domínio (filtros, deduplicação, seleção de ganhadores) têm testes unitários escritos antes da implementação.
- Cada critério de aceite de uma spec vira pelo menos um teste (unitário, de integração ou e2e).

## 4. Fronteira clara entre app e API
- Comunicação somente por contratos HTTP versionados documentados em `specs/<feature>/contracts/`.
- O frontend não chama redes sociais diretamente; credenciais e tokens ficam só no backend.

## 5. Privacidade e conformidade
- Coletamos o mínimo de dados de terceiros (nome de usuário público + texto do comentário).
- Respeitamos os termos de uso das plataformas de origem dos dados.
- Dados de sorteios têm política de retenção definida.

## 6. Simplicidade
- Sem abstrações especulativas: só se constrói o que uma spec pede.
- Pt-BR é o idioma da interface; código e identificadores em inglês.

## Stack de referência
- Frontend: Angular 20 (standalone components, signals), SCSS.
- Backend: .NET 10 Minimal API, OpenAPI.
- Persistência: PostgreSQL + EF Core (Npgsql).
- Hospedagem: VPS com **Dokploy** (Traefik + Docker Swarm). Front e API na mesma origem (`/` e `/api/*`), Postgres e backups gerenciados pelo Dokploy.
- Provedores externos: definidos nos `plan.md`.
