# Specs — BoaSorte

Este projeto segue **Spec-Driven Development (SDD)**. Nenhum código é escrito sem uma spec aprovada.

## Fluxo por feature

| Fase | Artefato | Pergunta que responde | Status gate |
|------|----------|-----------------------|-------------|
| 1. Specify | `spec.md` | **O quê** e **por quê** (sem tecnologia) | Sem `[NEEDS CLARIFICATION]` em aberto |
| 2. Clarify | seção *Clarificações* da `spec.md` | Ambiguidades resolvidas | Decisões registradas com data |
| 3. Plan | `plan.md` (+ `contracts/`, `data-model.md`) | **Como** (arquitetura, contratos de API, modelo) | Respeita a `constitution.md` |
| 4. Tasks | `tasks.md` | Passos pequenos, ordenados e testáveis | Cada task referencia um requisito (FR-xxx) |
| 5. Implement | código + testes | — | Critérios de aceite passam |

## Repositórios

- `boasorte-app/` — frontend Angular (este repo)
- `../boasorte-api/` — backend .NET (repo separado)

As specs ficam aqui e cobrem ambos. Contratos de API (`contracts/`) são a fronteira entre os dois.

## Índice

| ID | Feature | Fase |
|----|---------|------|
| [001](001-sorteio-lista/spec.md) | Sorteio por lista (nomes/números) | Planned → [tasks](001-sorteio-lista/tasks.md) |
| [002](002-sorteio-comentarios/spec.md) | Sorteio de comentários (Instagram/Facebook via OAuth) | Clarified |
| [003](003-landing-page/spec.md) | Landing page | Clarified |

### Ordem de entrega sugerida
1. **001 — Sorteio por lista:** sem dependências externas. Estabelece o domínio de sorteio, a persistência e o link compartilhável que a 002 reutiliza.
2. **003 — Landing + termos/privacidade:** necessária para submeter o app ao App Review da Meta.
3. **002 — Comentários:** começar o cadastro do app na Meta e o App Review **em paralelo** com a 001, porque a aprovação leva semanas.

Princípios transversais: [constitution.md](constitution.md).
