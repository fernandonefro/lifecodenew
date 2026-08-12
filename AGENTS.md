# AGENTS.md - LIFECODE SaMD PROJECT WORKSPACE CONTEXT

Welcome to the Lifecode SaMD (Software as a Medical Device) project repository.

## Master Context & Traceability Index

All architectural definitions, regulatory requirements, LGPD privacy models, AES-256-GCM encryption services, multi-tenant guards, database schemas, APIs, clinical rules, Golden Test Cases, Playwright E2E suites, Operator Portal analytics, skill definitions, OpenAPI 3.0 specs, interactive Swagger UI, production Docker multi-stage images, Nginx TLS proxy, enterprise monorepo structure, `@lifecode/shared` library, mobile app components, and UX/UI specifications are fully documented and versioned within this workspace to guarantee 100% traceability to the original PRD.

### Workspace Structure & Deliverable Map

```
C:\Users\fernando\.gemini\antigravity\scratch\lifecode\
├── pnpm-workspace.yaml                 # Configuração do pnpm workspaces
├── turbo.json                          # Pipeline de builds e dev Turborepo
├── package.json                        # Monorepo root package.json
├── docker-compose.yml                  # Postgres (pgvector + UTC), Redis 7, Mailpit, API (Dev)
├── docker-compose.prod.yml             # Orquestração Completa do Piloto (Postgres UTC, Redis, API, Web, Nginx)
├── .env.example                        # Modelo de Variáveis de Ambiente de Produção
├── playwright.config.ts                # Configuração da Suíte E2E Playwright
├── README.md                           # Documentação executiva & comando 1-linha (pnpm install && pnpm dev)
├── .agents/
│   └── skills/
│       ├── lifecode-operator-portal/   # Skill de Referência: Especificação e Código do Portal da Operadora (US-21 + US-22)
│       └── lifecode-docker-deployment/ # Skill de Implantação: Dockerfiles, Nginx SSL e Docker Compose
├── docs/
│   ├── openapi.yaml                    # Especificação Técnica Oficial OpenAPI 3.0.3 da Lifecode API
│   ├── context_traceability_matrix.md  # Matriz de Rastreabilidade PRD vs Artefatos
│   └── operator_portal_technical_spec.md # Especificação Técnica do Portal da Operadora (US-21 & US-22)
├── infra/
│   └── nginx/
│       └── nginx.conf                  # Nginx Reverse Proxy (SSL/TLS 1.2/1.3, Rate Limiting & OWASP Headers)
├── tests/
│   └── e2e/
│       └── clinical-circuit.spec.ts    # Suíte E2E Playwright (Circuito Assistencial Completo & Concorrência)
├── apps/
│   ├── api/                            # Backend API NestJS 10 (Swagger UI em /api/docs, Dockerfile, Healthcheck)
│   │   ├── Dockerfile                  # Build Multi-stage Node 20 Alpine com Non-Root User lifecode
│   │   └── src/
│   │       ├── main.ts                 # Bootstrap NestJS com SwaggerModule.setup('api/docs') e ZodPipe
│   │       └── modules/
│   │           ├── health/             # HealthController para Docker HEALTHCHECK (/api/v1/health)
│   │           ├── observations/       # GlucoseService & GlucoseController (US-06 Ingestão & Alertas)
│   │           └── analytics/          # OperatorAnalyticsService & OperatorAnalyticsController (US-21 & US-22)
│   ├── web/                            # Frontend Next.js 14 App Router (Portal Profissional & Operator Portal)
│   │   └── Dockerfile                  # Build Multi-stage Node 20 Alpine Standalone Output
│   └── mobile/                         # Mobile App Expo React Native (App do Paciente)
├── packages/
│   ├── database/                       # Schema Prisma Otimizado (Tenant, User, CareGap, RiskStratification, PopulationMetric)
│   └── shared/                         # Pacote Compartilhado: Enums, Zod Schemas, FHIR R4, UCUM e Casos-Ouro
└── backlog/
    └── lifecode_backlog.json           # Backlog JSON com Stories P0 (US-01 a US-15, US-21/22/25-28)
```

## Regulatory Baseline & Safety Commitments
- **ANVISA RDC 751/2022**: SaMD Class II.
- **IEC 62304**: Class B & Class C (Clinical Engine & Emergency Alerts).
- **ISO 14971**: Physiological risk mitigations & hard boundary limits (10-700 mg/dL).
- **LGPD & HIPAA**: E2EE, AES-256-GCM encryption at rest, PostgreSQL RLS tenant isolation, `ConsentLog` tracking, immutable `AuditLog` with HMAC.
- **CFM 2.314/2022**: ICP-Brasil digital signature verification for prescriptions.

Refer to `docs/context_traceability_matrix.md` for full cross-references.
