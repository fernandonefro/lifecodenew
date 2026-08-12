# ESTADO ATUAL DA PLATAFORMA LIFECODE

> Última atualização: 2026-08-12 | Resultados de execução real confirmados nesta sessão

---

## ✅ Funcionalidades PRONTAS e funcionando

| Funcionalidade | Arquivo / Rota principal | Observações |
|---|---|---|
| Ingestão de glicemia com idempotência | `apps/api/src/modules/observations/glucose.service.ts` / `POST /api/v1/observations/glucose` | Motor de regras P0/P1 integrado |
| Motor de alertas P0/P1 | `apps/api/src/modules/observations/glucose.service.ts#evaluateGlucoseAlertRules` | P0: glicemia < 54 OU sintomas críticos OU > 300 + cetose; P1: 54–69 OU > 250 |
| Geração de alertas no banco com SLA | `apps/api/src/modules/observations/glucose.service.ts#calculateSlaDueDate` | P0 = imediato, P1 = 4h |
| Schemas Zod de validação clínica | `packages/shared/src/schemas/` | glucoseIngestion, vitals, observationBase, operatorPortal |
| Tipos FHIR R4 para observações | `packages/shared/src/fhir/` | Tipagem TypeScript — sem integração com servidor FHIR real |
| Conversor de unidades UCUM (mg/dL ↔ mmol/L) | `packages/shared/src/units/ucum-converter.ts` | |
| Utilitários de data/fuso horário UTC | `packages/shared/src/date-utils.ts` | |
| Enums de domínio | `packages/shared/src/enums/` | Role, AlertSeverity (P0–P3), MeasurementSource, MeasurementContext |
| Modelo de dados completo (Prisma schema) | `packages/database/prisma/schema.prisma` | 11 modelos, 8 enums |
| Autenticação JWT com 7 papéis | `apps/api/src/auth/` | register, login, me, role guard |
| Isolamento multi-tenant | `apps/api/src/common/tenant/` | Guard + interceptor |
| Criptografia AES-256-GCM de campos sensíveis | `apps/api/src/common/security/crypto.service.ts` | Usa `FIELD_ENCRYPTION_KEY` |
| Health check da API | `apps/api/src/modules/health/` / `GET /api/v1/health` | |
| Swagger UI | `apps/api/src/main.ts` / `GET /api/docs` | |
| Portal da Operadora — Estratificação de Risco (US-21) | `apps/web/src/app/(operator)/dashboard/page.tsx` | Dados mockados com fallback |
| Portal da Operadora — Lacunas de Cuidado (US-22) | `apps/web/src/app/operator/page.tsx` | Dados mockados |
| App Mobile — Home/Timeline (US-01) | `apps/mobile/src/app/(tabs)/index.tsx` | Dados 100% mockados — 3 cards de prioridade hardcoded, sem fetch de API |
| App Mobile — Entrada de glicemia | `apps/mobile/src/app/glucose-entry.tsx` | Formulário Zod + RHF completo |
| App Mobile — Hook de ingestão de glicemia | `apps/mobile/src/hooks/useGlucoseIngestion.ts` | React Query mutation |
| Infraestrutura Docker dev | `docker-compose.yml` | Postgres, Redis, Mailpit |
| Infraestrutura Docker prod | `docker-compose.prod.yml` | + API, Web, Nginx |
| Nginx reverse proxy | `infra/nginx/nginx.conf` | TLS requer certificados externos |
| Golden Cases Clínicos | `packages/shared/src/testing/golden-cases.data.ts` | Imutáveis sem aprovação clínica |
| Testes E2E Playwright (circuito assistencial) | `tests/e2e/clinical-circuit.spec.ts` | 2 cenários escritos |

---

## ⚠️ Funcionalidades PARCIAIS

### 1. App Mobile — Tela de Histórico (US-07)
- **Situação confirmada**: O arquivo `apps/mobile/src/app/(tabs)/history.tsx` **NÃO EXISTE**.
- A pasta `(tabs)/` contém apenas `index.tsx`.
- A tela Home (`index.tsx`) exibe 1 card de "Tendência da Semana" com dados completamente mockados: `"Sua média semanal está em 128 mg/dL. 85% do tempo no alvo."` — valores hardcoded, sem fetch.
- O botão "Ver Detalhes" nesse card não tem rota associada (`route` está ausente no objeto `PriorityItem` correspondente).
- **O que quebra hoje**: O usuário clica em "Ver Detalhes" → nada acontece (sem rota configurada).

### 2. Tela Home Mobile — Dados Mockados
- **O que existe**: `apps/mobile/src/app/(tabs)/index.tsx` renderiza 3 cards de prioridade com dados hardcoded.
- **O que está mockado**: Nome do paciente ("Fernando"), glicemia média da semana (128 mg/dL), TIR (85%), nome do médico ("Dr. Fernando"), data da consulta (20/Ago) — tudo hardcoded no array `topPriorities`.
- **O que falta**: Fetch das prioridades do dia via API. Hook de dados da home não existe.

### 3. Build Docker — `lifecode-web`
- **Situação**: Docker Desktop estava fechado nesta sessão de verificação — build não pôde ser executado.
- **Última evidência disponível** (sessão anterior, 2026-08-10): O build Docker da API confirmou `DONE` com sucesso. O build do Web recebeu correção da pasta `public` e Dockerfile foi corrigido com `RUN mkdir -p /app/apps/web/public` no builder stage.
- **Status**: ⚠️ **NÃO CONFIRMADO NESTA SESSÃO** — requer Docker Desktop aberto para verificar.

### 4. Fila de Atendimento de Alertas (Portal Profissional)
- **O que existe**: Alertas são criados no banco — tabela `alerts` com status `OPEN`, severity e dueDate.
- **O que falta**: Interface `/alerts`, endpoints de assumir e fechar alerta.
- Os testes E2E em `tests/e2e/clinical-circuit.spec.ts` já descrevem o comportamento esperado — sem implementação.

### 5. Estratificação de Risco e Care Gaps com Dados Reais
- Dashboards existem no portal web mas exibem dados mockados/hardcoded.
- Jobs de cálculo automático não existem.

---

## 📋 Funcionalidades APENAS PLANEJADAS

- **Alertas P2 e P3**: Ver seção específica abaixo.
- **MFA**: Campos `mfaEnabled`/`mfaSecret` no modelo `User` — sem implementação.
- **Módulo de E-mail/SMTP**: Feature planejada — ver seção específica abaixo.
- **Integração CGM (Dexcom/Libre)**: Enums no schema — sem código de integração.
- **Notificações Push Mobile**: Não existe.
- **Relatório ANS (PDF)**: Botão UI existe — sem endpoint.
- **Script de Seed (`db:seed`)**: O comando existe no `package.json` raiz mas **o script correspondente não existe em `packages/database`**. `pnpm db:seed` falha com "command not found".

---

## 🔍 Mapa de P2 e P3 — Para o Time Clínico Especificar

### Onde os enums estão definidos
`packages/shared/src/enums/alert-severity.enum.ts`:
```typescript
export enum AlertSeverity {
  P0_EMERGENCY = 'P0',   // Orientação imediata/emergência
  P1_HIGH_RISK = 'P1',   // Triagem e conduta no mesmo dia
  P2_GAP = 'P2',         // Lacuna de cuidado / 1-3 dias
  P3_OPPORTUNITY = 'P3', // Lembrete / acompanhamento regular
}
```

### Onde P2/P3 são referenciados no código
- **Nenhum arquivo** em `apps/api/src/` faz referência a `P2_GAP` ou `P3_OPPORTUNITY`. Confirmado por busca exaustiva.
- O enum `AlertSeverity` é importado em `glucose.service.ts` (`linha 3`), mas `evaluateGlucoseAlertRules()` só retorna `P0_EMERGENCY`, `P1_HIGH_RISK` ou `null`.

### O que acontece em runtime quando um paciente "cai" em P2 ou P3
**Hoje: silêncio total.** A função `evaluateGlucoseAlertRules()` retorna `null` para qualquer valor fora dos critérios P0/P1. Quando retorna `null`, nenhum alerta é criado. Não há erro, não há fallback — simplesmente nada acontece.

### Onde plugar as regras P2 e P3 quando o time clínico especificar
A função `evaluateGlucoseAlertRules()` em `apps/api/src/modules/observations/glucose.service.ts` linha 78–98 é o único ponto de extensão necessário. Basta adicionar os `if` correspondentes antes do `return null` final:
```typescript
// PONTO DE EXTENSÃO P2 — adicionar aqui:
if (/* critério P2 a ser especificado */) {
  return AlertSeverity.P2_GAP;
}
// PONTO DE EXTENSÃO P3 — adicionar aqui:
if (/* critério P3 a ser especificado */) {
  return AlertSeverity.P3_OPPORTUNITY;
}
return null;
```
O `buildAlertMessage()` (linha 100) e `calculateSlaDueDate()` (linha 107) também precisarão de casos para P2/P3.

---

## 📨 Módulo SMTP — Feature Planejada (sem implementação)

### Variáveis de ambiente existentes
| Variável | Onde é definida | Onde é lida no código |
|---|---|---|
| `SMTP_HOST` | `docker-compose.yml` linha 79 (injetada no container da API) | **Nenhum arquivo** em `apps/api/src/` |
| `SMTP_PORT` | `docker-compose.yml` linha 80 | **Nenhum arquivo** em `apps/api/src/` |

### Status real
As variáveis são injetadas no container mas **nenhum módulo de e-mail está implementado na API**. Não há `@nestjs-modules/mailer`, `nodemailer`, nem qualquer `MailService` ou `NotificationService` em `apps/api/src/`.

### Intenção do PRD
Envio automático de e-mail/SMS para profissionais de saúde quando um alerta P0 é gerado, e notificação de agendamentos/lembretes para pacientes. O container Mailpit no `docker-compose.yml` foi incluído para capturar esses e-mails em desenvolvimento sem envio real.

---

## 🏗️ Estado do Build — Resultados REAIS desta sessão (2026-08-12)

### `pnpm install`
✅ **PASSOU** — exit code 0, 24.4s  
Avisos (não bloqueantes):
- `react-dom@18.3.1` requer `react@^18.3.1` mas o projeto usa `react@18.2.0` (em `apps/web`)
- `date-fns-tz@2.0.1` requer `date-fns@2.x` mas o projeto usa `date-fns@3.x` (em `packages/shared`)

### `pnpm --filter @lifecode/database db:migrate`
❌ **FALHOU** — exit code 1  
```
Error: Prisma schema validation - (get-config wasm)
Error code: P1012
error: Environment variable not found: DATABASE_URL.
  -->  prisma\schema.prisma:4
```
**Motivo**: Esperado — Postgres não estava rodando localmente. Requer `docker compose up -d` antes.

### `pnpm --filter @lifecode/database db:push`
❌ **FALHOU** — exit code 1  
Mesmo erro `P1012 DATABASE_URL not found`. Mesmo motivo.

### `pnpm build`
⚠️ **PARCIALMENTE CONFIRMADO** — processo cancelado após travar em `Collecting build traces` (etapa final do Next.js build no Windows com Turborepo):
- `@lifecode/shared:build` (tsc) ✅ Sem erros
- `@lifecode/database:build` (prisma generate) ✅ `Generated Prisma Client (v5.22.0)`
- `@lifecode/web:build` (next build) ✅ `Compiled successfully` + `6/6 páginas estáticas geradas` — travou em `Collecting build traces`
- `@lifecode/api:build` (tsc) ⚠️ Iniciado, sem output de erro ou sucesso antes do cancelamento
- `@lifecode/mobile:build` — Não aparece no output (sem script `build` em `apps/mobile/package.json`)

### `pnpm test`
❌ **FALHOU** — exit code 1  
```
Error:   x could not find task `test` in project
```
**Motivo**: O `turbo.json` não define a tarefa `test`, e nenhum `package.json` de workspace tem script `test` configurado. O Jest está listado como dependência em `apps/api/package.json` mas o script `"test": "jest"` não foi incluído no `turbo.json`. Nenhum teste rodou.

### Docker build `lifecode-web`
❌ **NÃO EXECUTADO nesta sessão** — Docker Desktop estava fechado.  
```
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
```
**Status da última sessão verificada** (2026-08-10): Build da API confirmado DONE. Build do Web recebeu correção — resultado não confirmado.

---

## 🐛 Bugs Conhecidos e Limitações Aceitas

| Bug / Limitação | Localização | Impacto |
|---|---|---|
| `PrismaService` tipado como `any` nas queries | `glucose.service.ts`, `analytics.service.ts`, `operator-analytics.service.ts` | Perda de type-safety — aceito temporariamente |
| CORS `origin: '*'` | `apps/api/src/main.ts:12` | **Inaceitável para produção** — deve ser restringido |
| `pnpm test` falha — tarefa não configurada no Turborepo | `turbo.json` | Nenhum teste roda via `pnpm test` |
| Home mobile com nome hardcoded "Fernando" | `apps/mobile/src/app/(tabs)/index.tsx:14–30` | UX incorreta para qualquer outro usuário |
| Botão "Ver Detalhes" (Tendência da Semana) sem rota | `apps/mobile/src/app/(tabs)/index.tsx:23` | Clique silenciosamente ignorado |
| `.gitignore` ausente no repositório | raiz | ⚠️ `.env` com segredos poderia ser commitado acidentalmente — **CRÍTICO** |
| `db:seed` referenciado na raiz mas não implementado | `package.json:13`, `packages/database/package.json` | Falha silenciosamente |
| Peer dependency warnings | `apps/web`, `packages/shared` | `react 18.2 vs 18.3`, `date-fns 3.x vs 2.x` — não bloqueantes |

---

## 💸 Dívida Técnica

| Item | Arquivo | Motivo |
|---|---|---|
| `prisma as any` em todos os services | `glucose.service.ts`, `analytics.service.ts`, `operator-analytics.service.ts` | Prisma Client não reconhecido sem migration + generate rodados |
| `app.enableCors({ origin: '*' })` | `apps/api/src/main.ts:12` | Dev local; deve ser restringido antes do piloto |
| Analytics com dados hardcoded | `analytics.service.ts#getUtilizationMetrics` | Piloto sem dados reais de PA/internações |
| `turbo.json` sem tarefa `test` | `turbo.json` | Testes não rodam via `pnpm test` |
| Home mobile com dados 100% mockados | `apps/mobile/src/app/(tabs)/index.tsx` | Não conectada à API |
| Sem `pnpm-lock.yaml` commitado | raiz | `pnpm install --frozen-lockfile` falha |
