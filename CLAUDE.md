# CLAUDE.md — Lifecode SaMD Platform

## O Produto
Lifecode é uma plataforma SaMD (Software as a Medical Device) para gestão de pacientes com diabetes crônico de alto risco. Ela conecta pacientes, equipes clínicas e operadoras de saúde em um único circuito assistencial: o paciente registra glicemias no app mobile → um motor de regras clínicas detecta emergências → alertas são roteados para a fila de uma equipe de enfermeiros/navegadores → a operadora monitora a carteira inteira via analytics populacional. O usuário final é triplo: paciente (mobile), profissional de saúde (portal web), e analista de operadora (portal web).

## Stack e Versões Exatas

| Camada       | Tecnologia                        | Versão         |
|--------------|-----------------------------------|----------------|
| Monorepo     | pnpm workspaces + Turborepo       | pnpm 8.15.0 / turbo ^1.12.0 |
| Runtime      | Node.js                           | >=18.0.0       |
| Backend API  | NestJS                            | ^10.3.0        |
| ORM          | Prisma                            | ^5.9.0         |
| Banco        | PostgreSQL 16 + pgvector          | 16             |
| Cache/Filas  | Redis                             | 7-alpine       |
| Portal Web   | Next.js (App Router)              | ^14.1.0        |
| Mobile       | React Native + Expo Router        | expo ~50.0.4 / RN 0.73.4 |
| Validação    | Zod                               | ^3.22.4        |
| Autenticação | JWT (passport-jwt)                | ^10.2.0        |
| Tipos        | TypeScript                        | ^5.3.3         |
| Testes E2E   | Playwright                        | (ver playwright.config.ts) |
| Infra        | Docker + Docker Compose           | —              |

## Comandos Essenciais

```bash
# Instalar dependências (sempre da raiz)
pnpm install

# Dev: subir todos os apps em paralelo
pnpm dev

# Build de todos os pacotes
pnpm build

# Testes unitários
pnpm test

# Lint
pnpm lint

# Infraestrutura local (Postgres + Redis + Mailpit)
docker compose up -d

# Infraestrutura de produção completa (todos os containers)
docker compose -f docker-compose.prod.yml up -d --build

# Migrations do banco (requer Postgres rodando — ver AMBIENTE.md)
pnpm db:migrate
# ou direto:
pnpm --filter @lifecode/database db:migrate

# ⚠️ Não há script db:seed implementado. Ver item A5 no backlog (PROXIMOS_PASSOS.md).

# Gerar Prisma Client após alterar schema.prisma
pnpm db:generate
# ou direto:
pnpm --filter @lifecode/database build

# Verificar se .env está configurado antes de qualquer comando de banco:
# cp .env.example .env  && editar com valores reais
```

## Estrutura de Pastas

```
lifecode/
├── apps/
│   ├── api/          # Backend NestJS (porta 3000 local, 3000 no container)
│   ├── web/          # Portal Next.js — Profissional e Operadora
│   └── mobile/       # App React Native Expo — Paciente
├── packages/
│   ├── shared/       # Biblioteca interna: enums, schemas Zod, tipos FHIR, utilitários
│   └── database/     # Wrapper do Prisma: schema.prisma + PrismaClient
├── docs/             # OpenAPI YAML, matriz de rastreabilidade
├── tests/e2e/        # Testes Playwright do circuito assistencial completo
├── infra/            # nginx.conf (reverse proxy, TLS, rate limiting)
├── docker-compose.yml          # Dev: Postgres, Redis, Mailpit
└── docker-compose.prod.yml     # Prod: + API, Web, Nginx
```

## Convenções Obrigatórias

### Nomenclatura
- Arquivos: `kebab-case.ts` (ex: `glucose.service.ts`)
- Classes/Enums: `PascalCase`
- Variáveis/funções: `camelCase`
- Constantes exportadas: `SCREAMING_SNAKE_CASE`
- Tabelas Prisma: `snake_case` com `@@map("nome_tabela")`

### API
- Todos os endpoints: `POST /api/v1/...`, `GET /api/v1/...`
- Header obrigatório de multi-tenancy: `X-Tenant-ID: <uuid>`
- Formato de resposta: `{ status: 'CREATED'|'OK'|'IDEMPOTENT_SKIPPED', data: {...} }`
- Erros: padrão NestJS com HttpException

### Validação
- DTOs de entrada: usar `class-validator` decorators (NÃO usar `createZodDto` — causa TS2509 no TS5+)
- Schemas Zod ficam em `packages/shared/src/schemas/` — são a fonte da verdade de tipos

### Dados de paciente
- Toda query ao banco deve incluir `where: { tenantId }` — isolamento multi-tenant obrigatório
- Campos sensíveis (CPF, senha) nunca chegam ao log
- AuditLog com HMAC deve ser gerado para toda mutação de dado clínico

## Regras de "Não Faça"
- **NUNCA edite manualmente** `packages/database/prisma/` gerados: `*.d.ts`, `index.js` em `node_modules/.prisma`
- **NUNCA** use `createZodDto()` como base de classe DTO — reescreva com `class-validator`
- **NUNCA** faça query sem `tenantId` no `where` — viola o isolamento multi-tenant (CA-01)
- **NUNCA** logue CPF, `passwordHash`, `ENCRYPTION_KEY` ou `JWT_SECRET`
- **NÃO** altere `packages/shared/src/testing/golden-cases.data.ts` sem aprovação do Comitê Clínico
- **NÃO** use `baseUrl` no `tsconfig.json` — foi removido no TypeScript 5.x (TS5102)

## Regras LGPD e Dado Sensível
- Toda tabela com dado identificável de paciente: `User`, `Patient`, `ClinicalObservation`, `ConsentLog`, `AuditLog`
- Coleta de consentimento (TCLE + LGPD) é pré-requisito para qualquer ingestão de dado clínico
- Retenção de `AuditLog`: mínimo 5 anos (regulação ANS/CFM)
- Qualquer nova coluna com dado pessoal deve ser discutida com o time de compliance antes de ir ao schema
- Em ambiente de desenvolvimento: **nunca use dados reais de pacientes**
