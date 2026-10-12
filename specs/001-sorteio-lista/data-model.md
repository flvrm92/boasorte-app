# 001 — Modelo de dados

## Tabela `draws`

| Coluna | Tipo | Nulo | Observação |
|--------|------|------|------------|
| `id` | `uuid` | não | PK (UUID v7, gerado na aplicação) |
| `public_id` | `varchar(12)` | não | **UNIQUE**; base62 por CSPRNG |
| `title` | `varchar(120)` | sim | |
| `kind` | `varchar(10)` | não | `list` \| `range` (CHECK) |
| `remove_duplicates` | `boolean` | não | sempre `false` para `range` |
| `show_participants` | `boolean` | não | padrão `true` |
| `winners_count` | `integer` | não | CHECK `>= 1` |
| `range_start` | `integer` | sim | obrigatório se `kind = range` |
| `range_end` | `integer` | sim | obrigatório se `kind = range`; CHECK `range_end >= range_start` |
| `submitted_count` | `bigint` | não | entradas recebidas antes de normalizar/deduplicar (`range`: igual a `eligible_count`) |
| `eligible_count` | `bigint` | não | participantes sorteáveis (um intervalo de ±1 bi tem 2.000.000.001 números) |
| `participants` | `text[]` | não | elegíveis na ordem original; vazio (`{}`) para `range` |
| `winners` | `text[]` | não | em ordem (índice 0 = 1º lugar) |
| `created_at` | `timestamptz` | não | UTC |
| `expires_at` | `timestamptz` | não | `created_at + 12 meses`; **índice** (usado pela purga) |

## Regras
- **Imutável:** não existe UPDATE. A aplicação só faz INSERT, SELECT e o DELETE da purga.
- `participants` é guardado mesmo com `show_participants = false`. Ele serve de registro de auditoria; a flag só controla o que a resposta pública expõe.
- Para `range`, os ganhadores são guardados como texto (`"42"`) para manter um formato único na resposta.

## Mapeamento EF Core (Infrastructure)
O agregado de domínio `Draw` é mapeado **diretamente**, sem uma entidade de persistência paralela. A configuração fica toda em `DrawConfiguration` (Infrastructure); o Domain não conhece o EF.

| Domínio | Coluna(s) | Como |
|---------|-----------|------|
| `PublicId` | `public_id` | `ValueConverter<PublicId, string>` |
| `DrawTitle?` | `title` | `ValueConverter` (nulo permitido) |
| `DrawSettings` | `remove_duplicates`, `show_participants`, `winners_count` | `ComplexProperty` |
| `NumberRange?` | `range_start`, `range_end` | `ComplexProperty` opcional |
| `IReadOnlyList<Participant>` | `participants text[]` | `ValueConverter` + `ValueComparer` |
| `IReadOnlyList<Winner>` | `winners text[]` | `ValueConverter` (a posição vem do índice) + `ValueComparer` |
| `DrawKind` | `kind` | enum → string |

- Convenção snake_case (`EFCore.NamingConventions`).
- O construtor privado sem parâmetros do `Draw` existe só para o EF.
