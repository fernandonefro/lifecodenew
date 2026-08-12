# 🏥 Lifecode SaMD Enterprise Production Monorepo

> **Plataforma de Cuidado e Gestão do Diabetes Lifecode**  
> Software como Dispositivo Médico (SaMD) — ANVISA RDC 751/2022 | IEC 62304 Class C | ISO 14971 | LGPD & HIPAA Compliant

---

## 🚀 Quick Start (Inicialização em 1 Linha)

Para instalar as dependências de todos os aplicativos e pacotes e subir a aplicação em ambiente de desenvolvimento local, execute:

```bash
pnpm install && pnpm dev
```

> **Nota**: Para subir a infraestrutura completa de contêineres locais (PostgreSQL com `pgvector`, Redis e Mailpit), certifique-se de executar `docker compose up -d` antes ou em paralelo.

---

## 📦 Arquitetura de Monorepo (`pnpm` Workspaces + Turborepo)

```
.
├── apps/
│   ├── api/          # NestJS 10 Modular Monolith API (Swagger OpenAPI em /docs, Helmet, CORS, ValidationPipe)
│   ├── web/          # Next.js 14 App Router (Tailwind CSS, Dashboard do Profissional & Operadora)
│   └── mobile/       # Expo React Native App (Expo Router, App do Paciente iOS/Android)
├── packages/
│   ├── database/     # Prisma ORM 5 Exported Client (PostgreSQL + pgvector, Migrações e Seeds)
│   └── shared/       # Biblioteca compartilhada de Tipos FHIR R4/R5, Schemas Zod e Utilitários de Data/UTC
├── docker-compose.yml # Infraestrutura Local: Postgres/pgvector (UTC), Redis 7 & Mailpit
├── turbo.json        # Orquestração Turborepo de Pipelines Paralelas
└── README.md         # Documentação de Entrada
```

---

## 🛠️ Serviços & Interfaces Locais

* 🟢 **API NestJS (Swagger OpenAPI)**: `http://localhost:3000/docs`
* 🌐 **Portal Web Next.js**: `http://localhost:3001`
* 📱 **App Mobile Expo (Metro Bundler)**: `http://localhost:8081`
* 📬 **Mailpit (Painel de Testes de E-mail)**: `http://localhost:8025`
* 🗄️ **PostgreSQL (pgvector & UTC)**: `localhost:5432` (`lifecode_db`)
* ⚡ **Redis 7 (Pub/Sub & BullMQ)**: `localhost:6379`
