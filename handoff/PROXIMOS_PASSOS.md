# PRÓXIMOS PASSOS — Backlog Priorizado

> **Primeiro item para o Claude Code**: Item A1 — Confirmar e finalizar o build Docker do Web (bloqueante para qualquer acesso ao sistema).

---

## (A) Para Destravar o Próximo Release / Piloto

### A1. ✅ Confirmar build Docker do `lifecode-web` — BLOQUEANTE
**O que fazer**: Rodar `docker compose -f docker-compose.prod.yml up -d --build` e confirmar que ambos os containers (`lifecode-api` e `lifecode-web`) sobem com status `healthy`.  
**Arquivos tocados**: `apps/web/Dockerfile`, `apps/web/public/.gitkeep`  
**Critério de aceite**: `docker compose -f docker-compose.prod.yml ps` mostra todos os 5 serviços com `Status: running`  
**Riscos**: Se o Next.js build falhar por outra razão, investigar erros em `apps/web/src/`  
**Dependências**: Docker Desktop rodando, `.env` configurado  

---

### A2. Rodar a Migration Inicial do Banco — BLOQUEANTE
**O que fazer**: Com o container Postgres rodando, executar `pnpm db:migrate` para criar todas as tabelas. Verificar se o comando `pnpm --filter @lifecode/database db:migrate` funciona (referencia o script `migrate dev` no `package.json` de `packages/database`).  
**Arquivos tocados**: `packages/database/prisma/schema.prisma`, gera arquivos em `packages/database/prisma/migrations/`  
**Critério de aceite**: `psql` na base mostra as 11 tabelas criadas: `tenants`, `users`, `sessions`, `consent_logs`, `audit_logs`, `patients`, `clinical_observations`, `alerts`, `care_gaps`, `risk_stratifications`, `population_metrics`  
**Riscos**: A extensão `pgvector` precisa estar habilitada no Postgres — o container `pgvector/pgvector:pg16` já inclui, mas a migration precisa rodar `CREATE EXTENSION IF NOT EXISTS vector`  
**Dependências**: A1 (containers rodando)  

---

### A3. Restringir CORS antes do Piloto — SEGURANÇA CRÍTICA
**O que fazer**: Substituir `app.enableCors({ origin: '*' })` em `apps/api/src/main.ts:12` pela lista explícita de origens do piloto.  
**Arquivos tocados**: `apps/api/src/main.ts`  
**Critério de aceite**: Requisição de origem não autorizada retorna `403 CORS`  
**Riscos**: Quebrar o app mobile ou o portal web se as URLs não forem listadas corretamente  
**Dependências**: Saber as URLs definitivas do piloto  

---

### A4. Implementar Fila de Atendimento de Alertas (Portal Profissional)
**O que fazer**: Criar a interface `/alerts` no `apps/web` com a lista de alertas abertos, ordenada por severidade (P0 primeiro). Implementar os endpoints de assumir e fechar alerta na API.  
**Arquivos a criar/modificar**:
- `apps/web/src/app/alerts/page.tsx` (novo)
- `apps/api/src/modules/alerts/alerts.controller.ts` (novo)
- `apps/api/src/modules/alerts/alerts.service.ts` (novo) — endpoints: `GET /api/v1/alerts`, `PATCH /api/v1/alerts/:id/assume`, `PATCH /api/v1/alerts/:id/resolve`
- `apps/api/src/app.module.ts` — registrar o novo módulo  
**Critério de aceite**: Os dois cenários do teste E2E em `tests/e2e/clinical-circuit.spec.ts` passam com `npx playwright test`  
**Riscos**: O lock de concorrência (médico 1 vs médico 2) precisa de transação otimista no Prisma  
**Dependências**: A2 (banco com tabelas), A3 (CORS restrito)  

---

### A5. Criar Script de Seed com Dados Sintéticos — NÃO BLOQUEANTE mas necessário para demo
**O que fazer**: Criar `packages/database/src/seed.ts` com dados sintéticos (nunca reais) e adicionar o script `db:seed` ao `package.json` de `packages/database`.  
**Por que ainda não existe**: O comando `pnpm db:seed` no `package.json` raiz delega para `pnpm --filter @lifecode/database db:seed`, mas esse script **não existe** em `packages/database/package.json`. A chamada falha silenciosamente com "command not found".  
**Arquivos a criar/modificar**:
- `packages/database/src/seed.ts` (novo) — 1 tenant, 1 paciente, 1 médico, 1 analista, 10+ observações glicêmicas sintéticas incluindo 1 P0
- `packages/database/package.json` — adicionar `"db:seed": "ts-node src/seed.ts"`  
**Critério de aceite**: `pnpm db:seed` roda sem erro e popula o banco com dados de demonstração identificáveis como sintéticos  
**⚠️ REGRA INEGOCIÁVEL**: Nunca usar dados reais de pacientes no seed. Usar nomes fictícios (ex: "João Teste Silva"), CPFs inválidos (ex: 000.000.000-00), datas de nascimento fictícias.  
**Dependências**: A2 (migration rodada)


**O que fazer**: Criar `packages/database/src/seed.ts` com: 1 tenant de piloto, 3 usuários (1 paciente, 1 médico, 1 analista de operadora) e 10 observações glicêmicas de exemplo (incluindo 1 valor P0 para demonstração).  
**Arquivos tocados**: `packages/database/src/seed.ts` (novo), `packages/database/package.json` (adicionar script `db:seed`)  
**Critério de aceite**: `pnpm db:seed` roda sem erro e popula o banco com dados de demonstração  
**Riscos**: Senhas do seed devem ser fortes e claramente marcadas como dados de teste  
**Dependências**: A2  

---

## (B) Importante, mas não Bloqueante

### B1. Remover `as any` nos Services Prisma (Type Safety)
**O que fazer**: Após a migration rodar e o Prisma Client ser gerado, substituir `this.prisma as any` por `this.prisma` tipado nos services.  
**Arquivos tocados**: `apps/api/src/modules/observations/glucose.service.ts`, `apps/api/src/modules/analytics/analytics.service.ts`, `apps/api/src/modules/analytics/operator-analytics.service.ts`  
**Critério de aceite**: `pnpm build` passa sem `as any` nesses arquivos  
**Riscos**: Alguns campos do Prisma podem ter nomes diferentes do esperado — verificar contra o schema  
**Dependências**: A2  

---

### B2. Calcular e Persistir Estratificação de Risco (US-21 com dados reais)
**O que fazer**: Criar um job/cron (ou endpoint admin) que percorre os pacientes de um tenant, calcula o `RiskTier` com base em HbA1c e TIR, e persiste em `RiskStratification`. Substituir os dados mockados no dashboard.  
**Arquivos tocados**: `apps/api/src/modules/analytics/operator-analytics.service.ts`, novo job em `apps/api/src/modules/analytics/risk-calculation.job.ts`  
**Critério de aceite**: Dashboard `/operator/dashboard` exibe contagens reais do banco ao invés de valores hardcoded  
**Dependências**: A2, A5 (seed com dados)  

---

### B3. Criação Automática de Care Gaps (US-22 com dados reais)
**O que fazer**: Job que verifica data do último exame de cada paciente e cria/atualiza registros em `CareGap` automaticamente.  
**Arquivos tocados**: Novo `apps/api/src/modules/analytics/care-gap-detection.job.ts`  
**Critério de aceite**: Paciente sem HbA1c há 6 meses aparece automaticamente na lista de gaps  
**Dependências**: B2  

---

### B4. Tela de Histórico do Paciente no App Mobile (US-07)
**O que fazer**: Verificar se `apps/mobile/src/app/(tabs)/history.tsx` existe. Se não, criá-lo com fetch das últimas observações do paciente.  
**Arquivos tocados**: `apps/mobile/src/app/(tabs)/history.tsx`  
**Critério de aceite**: Paciente vê gráfico de linha com suas últimas 30 medições  
**Dependências**: A2  

---

### B5. Adicionar `pnpm-lock.yaml` ao Controle de Versão
**O que fazer**: Rodar `pnpm install` localmente e commitar o `pnpm-lock.yaml` gerado.  
**Arquivos tocados**: `pnpm-lock.yaml` (novo no git)  
**Critério de aceite**: `pnpm install --frozen-lockfile` passa no CI sem erros  
**Riscos**: O lockfile pode ser grande — avaliar se o `.gitignore` atual o exclui  
**Dependências**: Nenhuma  

---

## (C) Melhorias Futuras

### C1. Autenticação MFA (campos já no schema)
Os campos `mfaEnabled` e `mfaSecret` estão no modelo `User`. Implementar TOTP com `speakeasy` ou similar.

### C2. Notificações Push para Alertas P0/P1 no Mobile
Integrar Expo Push Notifications para alertar o paciente imediatamente após um alerta P0 ser criado.

### C3. Integração CGM (Dexcom/Libre)
Os enums `CLOUD_API_DEXCOM` e `CLOUD_API_LIBRE` estão no schema. Implementar worker de polling das APIs externas de CGM.

### C4. Exportação de Relatório ANS (PDF)
O botão "Exportar Relatório ANS" existe no UI do portal da operadora — implementar endpoint de geração de PDF com `puppeteer` ou `pdfkit`.

### C5. Row-Level Security (RLS) no PostgreSQL
Migrar o isolamento multi-tenant de código (where tenantId) para RLS nativo no banco — mais seguro e auditorável.

### C6. Cobertura de Testes
Adicionar testes unitários para o motor de regras clínicas em `glucose.service.ts` e os schemas Zod em `packages/shared`.

---

## 🎯 Primeiro Item para o Claude Code

**Comece pelo A1 + A2 em sequência.**

**Por quê**: Sem os containers rodando e o banco migrado, nada pode ser testado manualmente nem pelos testes E2E. Todo o resto do backlog depende disso. O A1 (confirmar build Docker) leva menos de 10 minutos se os Dockerfiles estiverem corretos; o A2 (migration) outros 5. Depois disso, o sistema estará navegável em `http://localhost` e o time pode validar o produto com stakeholders pela primeira vez.
