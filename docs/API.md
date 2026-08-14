# Contrato da API e Backlog — Fonte da Verdade

Este documento reconcilia as fontes que estavam divergentes (duas noções de OpenAPI
e três backlogs com numerações diferentes).

## OpenAPI — canônico = spec GERADO pela API

A fonte da verdade do contrato HTTP é o **OpenAPI gerado automaticamente pelo NestJS/Swagger**,
que reflete as rotas realmente montadas:

- **Interativo:** `http://<api-host>/api/docs` (Swagger UI)
- **JSON:** `http://<api-host>/api/docs-json`
- **Cópia versionada:** [`docs/openapi.generated.json`](./openapi.generated.json)

Regenerar a cópia versionada (com a API rodando):

```bash
curl -s http://localhost:3000/api/docs-json -o docs/openapi.generated.json
```

O arquivo manual [`docs/openapi.yaml`](./openapi.yaml) está **SUPERADO** — divergia das rotas
reais e é mantido só como referência de design.

### Superfície atual (13 rotas, todas sob o prefixo global `api/v1`)

| Método | Rota |
|---|---|
| POST | `/api/v1/auth/login`, `/api/v1/auth/register` |
| GET | `/api/v1/auth/me`, `/api/v1/auth/physician/dashboard-access` |
| POST/GET | `/api/v1/observations/glucose` (ingestão / histórico) |
| GET | `/api/v1/alerts` |
| PATCH | `/api/v1/alerts/{id}/assume`, `/api/v1/alerts/{id}/resolve` |
| GET | `/api/v1/analytics/population-risk`, `/care-gaps`, `/utilization-stats` |
| GET | `/api/v1/operator/analytics/overview` |
| GET | `/api/v1/health` |

> Nota histórica: os controllers repetiam `api/v1` no `@Controller(...)` além do
> `setGlobalPrefix('api/v1')`, gerando rotas duplas `/api/v1/api/v1/...` que nunca batiam
> com os clientes. Corrigido — o prefixo vive só em `setGlobalPrefix`.

## Backlog — canônico = handoff/PROXIMOS_PASSOS.md

Existiam três trilhas de backlog. Para execução, vale **`handoff/PROXIMOS_PASSOS.md`** (A/B/C).

- `handoff/PROXIMOS_PASSOS.md` — **operativo (A/B/C)** ✅ canônico
- `handoff/PENDENCIAS.md` — pendências de ambiente/sessão (P1–P7); não confundir com P0–P3 clínicos
- `backlog/lifecode_backlog.json` — PRD/visão (épicos/US); descreve um produto maior que o atual

O acompanhamento ativo das tarefas é feito no board do Trello do projeto.
