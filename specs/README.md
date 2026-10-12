# Specs — BoaSorte (boasorte.app)

Este projeto segue **Spec-Driven Development (SDD)**. Nenhum código é escrito sem uma spec aprovada.

## Fluxo por feature

| Fase | Artefato | Pergunta que responde | Status gate |
|------|----------|-----------------------|-------------|
| 1. Specify | `spec.md` | **O quê** e **por quê** (sem tecnologia) | Sem `[NEEDS CLARIFICATION]` em aberto |
| 2. Clarify | seção *Clarificações* da `spec.md` | Ambiguidades resolvidas | Decisões registradas com data |
| 3. Plan | `plan.md` (+ `contracts/`, `data-model.md`) | **Como** (arquitetura, contratos de API, modelo) | Respeita a `constitution.md` |
| 4. Tasks | `tasks.md` | Passos pequenos, ordenados e testáveis (TDD: 🔴 antes de 🟢) | Cada task referencia um requisito (FR-xxx) |
| 5. Implement | código + testes | — | Critérios de aceite passam |

Decisões técnicas difíceis de reverter viram [ADRs](adr/README.md).

## Repositórios

- `boasorte-app/` — client Angular (este repo; também guarda `specs/` e `deploy/`)
- `../boasorte-api/` — API .NET em Clean Architecture (repo separado)

## Índice

| ID | Feature | Fase |
|----|---------|------|
| [001](001-sorteio-lista/spec.md) | Sorteio por lista (nomes/números) | Planned → [tasks](001-sorteio-lista/tasks.md) |
| [002](002-sorteio-comentarios/spec.md) | Sorteio de comentários (Instagram/Facebook via OAuth) | Clarified |
| [003](003-landing-page/spec.md) | Landing page | Clarified |
| [004](004-design-system/spec.md) | Design system, temas e PoC Material × PrimeNG | Fundação implementada → [tasks](004-design-system/tasks.md) |

Princípios transversais: [constitution.md](constitution.md).

### Ordem de entrega sugerida
1. **001 Fases 0–4:** setup, API completa (Domain → Application → Infra/Api) e domínio do client. Não depende da UI.
2. **004 PoC → ADR 0001** (pode começar logo após a T005, em paralelo com a API).
3. **004 Fundação → 001 Fase 5 (UI) → 003 Landing.**
4. **001 Fase 6:** e2e e deploy em `boasorte.app`.
5. **002 Comentários:** começar o cadastro do app na Meta e o App Review **cedo**, em paralelo, porque a aprovação leva semanas e exige a política de privacidade da 003 publicada.
