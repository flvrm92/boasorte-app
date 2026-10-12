# 001 — Contrato da API (v1)

Base: `/api/v1`. JSON em camelCase. Os erros seguem `application/problem+json` (RFC 9457).

---

## `POST /api/v1/draws` — sorteio oficial (sortear e salvar)

Rate limit: 10 requisições/min por IP → `429`. Corpo máximo: 3 MB.

### Request — lista
```json
{
  "title": "Rifa do churrasco",
  "kind": "list",
  "participants": ["Ana", "Bruno", "ana ", ""],
  "removeDuplicates": true,
  "winnersCount": 1,
  "showParticipants": true
}
```

### Request — intervalo
```json
{
  "title": null,
  "kind": "range",
  "range": { "start": 1, "end": 500 },
  "winnersCount": 2,
  "showParticipants": true
}
```

### Validação → `400` com `errors` por campo

| Campo | Regra |
|-------|-------|
| `title` | opcional, ≤ 120 caracteres |
| `kind` | `list` \| `range` |
| `participants` | obrigatório se `list`; ≤ 10.000 itens; cada item ≤ 200 caracteres (após trim) |
| `range` | obrigatório se `range`; inteiros em ±1.000.000.000; `start ≤ end` |
| `winnersCount` | `1 ≤ n ≤ min(elegíveis, 1000)`. Se exceder os elegíveis, o erro informa o número de elegíveis. |
| `removeDuplicates` | ignorado em `range` |

Exemplo:
```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": { "winnersCount": ["Há apenas 2 participantes elegíveis."] }
}
```

### Response — `201 Created`
Header `Location: /api/v1/draws/{publicId}`. O corpo é igual ao do `GET` abaixo.

---

## `GET /api/v1/draws/{publicId}` — resultado público

| Status | Quando |
|--------|--------|
| `200` | encontrado e válido |
| `404` | não existe (ou já purgado) |
| `410` | expirado (`expiresAt` no passado) |

### Response — `200`
```json
{
  "publicId": "aZ3k9QpL0xYt",
  "title": "Rifa do churrasco",
  "kind": "list",
  "createdAt": "2026-10-11T18:22:05Z",
  "expiresAt": "2027-10-11T18:22:05Z",
  "settings": {
    "removeDuplicates": true,
    "winnersCount": 1,
    "showParticipants": true,
    "range": null
  },
  "submittedCount": 4,
  "eligibleCount": 2,
  "winners": [ { "position": 1, "value": "Bruno" } ],
  "participants": ["Ana", "Bruno"]
}
```
- `participants` é `null` quando `showParticipants = false` ou `kind = range`.
- O cliente monta a URL pública como `{origin}/s/{publicId}`; a API não conhece o domínio do front.

---

## `GET /api/health`
`200` quando a API e o banco respondem; `503` caso contrário. Fora do versionamento, para uso da infraestrutura.
