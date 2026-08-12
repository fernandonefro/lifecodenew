# MATRIZ DE RASTREABILIDADE DE CONTEXTO - PROJETO LIFECODE SaMD

**Data de Atualização**: 09/08/2026  
**Status**: Versão 4.0.0 - Full Production Docker Deployment & Piloto Complete Baseline  
**Objetivo**: Mapeamento bidirecional de todos os requisitos do PRD Lifecode para os arquivos de definição e código no repositório.

---

## 1. Mapeamento de Requisitos do PRD vs Arquivos no Repositório

| Seção PRD / Requisito | Descrição | Arquivo no Workspace | Status |
| :--- | :--- | :--- | :---: |
| **Skill de Implantação**| Habilidade `lifecode-docker-deployment` (Dockerfiles & Compose) | [`.agents/skills/lifecode-docker-deployment/SKILL.md`](../.agents/skills/lifecode-docker-deployment/SKILL.md) | ✅ Persistido |
| **Docker Multi-Stage API**| Dockerfile Otimizado Node 20 Alpine com Non-Root User | [`apps/api/Dockerfile`](../apps/api/Dockerfile) | ✅ Implementado |
| **Docker Multi-Stage Web**| Dockerfile Standalone Next.js 14 | [`apps/web/Dockerfile`](../apps/web/Dockerfile) | ✅ Implementado |
| **Orquestração Piloto** | Compose de Produção (Postgres UTC, Redis, API, Web, Nginx) | [`docker-compose.prod.yml`](../docker-compose.prod.yml) | ✅ Implementado |
| **Nginx Reverse Proxy** | Proxy com TLS 1.2/1.3, Rate Limiting & OWASP Headers | [`infra/nginx/nginx.conf`](../infra/nginx/nginx.conf) | ✅ Implementado |
| **Config de Produção** | Exemplo de Variáveis de Ambiente `.env.example` | [`.env.example`](../.env.example) | ✅ Implementado |
| **Healthcheck Endpoint** | Rota `/api/v1/health` para verificações de integridade | [`apps/api/src/modules/health/health.controller.ts`](../apps/api/src/modules/health/health.controller.ts) | ✅ Implementado |
| **OpenAPI 3.0 Spec** | Especificação OpenAPI 3.0.3 oficial dos contratos REST da API | [`docs/openapi.yaml`](../docs/openapi.yaml) | ✅ Implementado |
| **Swagger UI NestJS** | Bootstrap da API com Swagger UI em `/api/docs` e `ZodValidationPipe` | [`apps/api/src/main.ts`](../apps/api/src/main.ts) | ✅ Implementado |
| **Skill da Operadora**| Habilidade `lifecode-operator-portal` (US-21 + US-22) | [`.agents/skills/lifecode-operator-portal/SKILL.md`](../.agents/skills/lifecode-operator-portal/SKILL.md) | ✅ Persistido |

---

## 2. Comando Único de Implantação do Piloto no Servidor
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
