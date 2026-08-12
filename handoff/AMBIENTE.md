# AMBIENTE — Setup do Zero

---

## Pré-requisitos de Máquina

| Ferramenta | Versão mínima | Como verificar |
|---|---|---|
| Node.js | 18.0.0 | `node --version` |
| pnpm | 8.0.0 | `pnpm --version` |
| Docker Desktop | 24+ | `docker --version` |
| Docker Compose | v2 (plugin) | `docker compose version` |
| Git | qualquer | `git --version` |

**Instalar pnpm** (se não tiver):
```bash
npm install -g pnpm
# ou via corepack:
corepack enable && corepack prepare pnpm@8.15.0 --activate
```

---

## Setup do Zero (máquina limpa)

```bash
# 1. Clonar o repositório
git clone <URL_DO_REPO> lifecode
cd lifecode

# 2. Instalar dependências do monorepo
pnpm install

# 3. Copiar as variáveis de ambiente
cp .env.example .env
# Edite .env com os valores reais (ver seção de variáveis abaixo)
# O .env está adicionado no .gitignore para evitar vazamento de credenciais.

# 4. Subir os serviços de infraestrutura (banco + cache + email dev)
docker compose up -d

# 5. Aguardar o PostgreSQL estar healthy (~10s) e rodar a migration
pnpm db:migrate
# [NÃO VERIFICADO] — se falhar, tente direto:
# pnpm --filter @lifecode/database db:migrate

# 6. Gerar o Prisma Client
pnpm db:generate
# ou:
pnpm --filter @lifecode/database build

# 7. Rodar em modo desenvolvimento
pnpm dev
```

---

## Variáveis de Ambiente

> ⚠️ **NUNCA commite valores reais.** O `.env` está no `.gitignore`. Use o `.env.example` como template.

### `.env` — Banco de Dados (PostgreSQL)

| Variável | Para que serve | Obrigatória | Onde obter |
|---|---|---|---|
| `DATABASE_URL` | Connection string completa do PostgreSQL | ✅ Sim | Montar: `postgresql://USER:PASS@HOST:5432/DBNAME?schema=public` |
| `DB_NAME` | Nome do banco (usado pelo Docker Compose) | ✅ Sim | Definir localmente (ex: `lifecode_dev`) |
| `DB_USER` | Usuário do banco | ✅ Sim | Definir localmente |
| `DB_PASSWORD` | Senha do banco | ✅ Sim | Gerar com `openssl rand -hex 16` |

### `.env` — Cache e Filas (Redis)

| Variável | Para que serve | Obrigatória | Onde obter |
|---|---|---|---|
| `REDIS_URL` | Connection string do Redis | ✅ Sim | `redis://:SENHA@localhost:6379` |
| `REDIS_PASSWORD` | Senha do Redis (usada pelo Docker Compose) | ✅ Sim | Gerar com `openssl rand -hex 16` |

### `.env` — Segurança JWT

| Variável | Para que serve | Obrigatória | Onde obter |
|---|---|---|---|
| `JWT_SECRET` | Assina e verifica tokens JWT | ✅ Sim | Gerar com `openssl rand -base64 32` — mínimo 32 chars |
| `JWT_EXPIRES_IN` | Tempo de expiração do access token | Opcional | Default hardcoded: `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | Tempo de expiração do refresh token | Opcional | Default hardcoded: `7d` |

### `.env` — Criptografia de Campos Sensíveis (AES-256-GCM)

| Variável | Para que serve | Obrigatória | Onde obter |
|---|---|---|---|
| `FIELD_ENCRYPTION_KEY` | Chave AES-256-GCM para campos sensíveis no banco | ✅ Sim | Deve ter **exatamente 32 bytes** — lido em `apps/api/src/common/security/crypto.service.ts` |

### `.env` — Aplicação

| Variável | Para que serve | Obrigatória | Onde obter |
|---|---|---|---|
| `NODE_ENV` | Ambiente (`development` / `production`) | ✅ Sim | `development` localmente |
| `PORT` | Porta da API NestJS | Opcional | Default: `3000` |
| `DOMAIN_NAME` | Domínio para o Nginx (prod) | Só prod | Ex: `piloto.lifecode.health` |

### `.env` — SMTP (email de alertas)

| Variável | Para que serve | Obrigatória | Onde obter |
|---|---|---|---|
| `SMTP_HOST` | Host do servidor SMTP | Opcional no dev | `mailpit` (container dev) |
| `SMTP_PORT` | Porta SMTP | Opcional no dev | `1025` (Mailpit dev) |

> ⚠️ Módulo de envio de e-mail **não está implementado** ainda — variáveis reservadas para implementação futura.

---

## Serviços Externos para Rodar Local

### Dev (`docker-compose.yml`)

```bash
docker compose up -d
```

| Serviço | Container | Porta local | Para que serve |
|---|---|---|---|
| PostgreSQL 16 + pgvector | `lifecode-postgres` | `5432` | Banco principal |
| Redis 7 | `lifecode-redis` | `6379` | Cache e filas |
| Mailpit | `lifecode-mailpit` | `8025` (UI), `1025` (SMTP) | Captura de e-mails em dev |

### Prod (`docker-compose.prod.yml`)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

| Serviço | Container | Porta pública |
|---|---|---|
| PostgreSQL 16 | `lifecode-db` | Interno |
| Redis 7 | `lifecode-redis` | Interno |
| API NestJS | `lifecode-api` | Interno (via Nginx) |
| Portal Next.js | `lifecode-web` | Interno (via Nginx) |
| Nginx | `lifecode-nginx` | `80`, `443` |

---

## Migrations e Dados de Teste

```bash
# Criar e aplicar migration (desenvolvimento)
pnpm db:migrate
# [NÃO VERIFICADO] — alternativa direta:
pnpm --filter @lifecode/database db:migrate

# Apenas sincronizar o schema sem gerar migration (útil para dev rápido)
pnpm --filter @lifecode/database db:push
# [NÃO VERIFICADO]

# Popular banco com dados de teste
# ⚠️ Script db:seed NÃO EXISTE em packages/database — o comando na raiz falha.
# Ver item A5 em PROXIMOS_PASSOS.md: "criar script de seed com dados sintéticos"
```

Para testes E2E com Playwright, todos os containers devem estar rodando:
```bash
docker compose up -d
pnpm --filter @lifecode/database db:push
npx playwright test
```

---

## Pegadinhas de Ambiente Que Já Custaram Tempo

### 1. Docker Desktop precisa estar aberto (Windows)
O comando `docker compose` falha com `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified` se o aplicativo Docker Desktop estiver fechado. **Solução**: Abrir o Docker Desktop manualmente e aguardar o ícone da baleia ficar estático.

### 2. pnpm não reconhecido no PowerShell (Windows)
Erro: `pnpm : O termo 'pnpm' não é reconhecido`. **Solução**: `npm install -g pnpm` e abrir um novo terminal.

### 3. Build Docker falha com `Cannot find module '@nestjs/common'`
Acontece quando o pnpm usa o virtual store ao invés de `node_modules` flat. **Solução**: O arquivo `.npmrc` na raiz com `shamefully-hoist=true` resolve — não removê-lo.

### 4. `createZodDto()` quebra o build TypeScript 5+
Qualquer schema Zod com `.transform()` não pode ser usado como base de classe DTO via `createZodDto()` — TypeScript lança TS2509. **Solução**: Usar `class-validator` decorators manualmente no DTO.

### 5. `baseUrl` removido do TypeScript 5.x
Se aparecer erro `TS5102: Option 'baseUrl' has been removed`, remover `baseUrl` do `tsconfig.json` e usar `paths` + `rootDir` corretamente.

### 6. Prisma Client não gerado = queries sem tipo
O `PrismaClient` é gerado pelo `prisma generate`. Se o client não foi gerado (migration não rodada), os services usam `as any` como workaround temporário. **Solução**: `pnpm db:generate` após o container do banco estar healthy.

### 7. Pasta `apps/web/public` precisa existir
O Dockerfile do Next.js copia a pasta `public` — se ela não existir (Next.js não a cria automaticamente sem assets), o build falha com `not found`. **Solução**: O arquivo `apps/web/public/.gitkeep` garante que a pasta seja versionada.

### 8. TLS no Nginx (produção)
O `infra/nginx/nginx.conf` referencia `ssl_certificate` e `ssl_certificate_key`. Os certificados precisam ser colocados em `infra/nginx/certs/` antes de subir o container do Nginx em produção. Em dev/piloto, usar Let's Encrypt (certbot) ou certificado autoassinado.
