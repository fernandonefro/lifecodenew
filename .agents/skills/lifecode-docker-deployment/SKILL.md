---
name: lifecode-docker-deployment
description: Infraestrutura Docker de produção, Dockerfiles multi-stage, Docker Compose com Nginx e scripts de healthcheck para o ambiente do piloto do projeto Lifecode.
---

# Lifecode Docker Deployment Skill

Este documento fornece as diretrizes e arquivos de configuração para implantação da plataforma Lifecode SaMD em ambientes de homologação e piloto através de containers Docker isolados e seguros.

## 1. Estrutura de Implantação
- **`apps/api/Dockerfile`**: Compilação multi-stage da API NestJS 10 com Node 20 Alpine, usuário não-root `lifecode`, e healthcheck em `/api/v1/health`.
- **`apps/web/Dockerfile`**: Compilação multi-stage do Portal Web Next.js 14 com output `standalone`.
- **`docker-compose.prod.yml`**: Orquestração contendo PostgreSQL 16 (UTC), Redis 7 (Senha), NestJS API, Next.js Web e Nginx Reverse Proxy (SSL/TLS e Rate Limiting).
- **`infra/nginx/nginx.conf`**: Proxy reverso com OWASP security headers, terminação SSL/TLS 1.2/1.3 e upgrade WebSockets.
- **`.env.example`**: Modelo de variáveis de ambiente com validação de obrigatoriedade.

## 2. Comando Único para Execução no Servidor
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
