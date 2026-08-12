# STAGE 1: Base & Build
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copia configuração do workspace
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY apps/api ./apps/api

# Instala todas as dependências com hoist
RUN pnpm install

# Compila packages na ordem correta
RUN pnpm --filter @lifecode/database build
RUN pnpm --filter @lifecode/shared build

# Compila a API - mostra todos os erros antes de falhar
RUN cd apps/api && npx -p typescript tsc --noEmit false 2>&1 || (echo "=== TSC ERRORS ABOVE ===" && exit 1)

# STAGE 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml .npmrc ./
COPY packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY packages/database ./packages/database
COPY apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist

RUN pnpm install --prod || true
RUN pnpm --filter @lifecode/database build || true

RUN addgroup -S lifecode && adduser -S lifecode -G lifecode
USER lifecode

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

CMD ["node", "apps/api/dist/main.js"]
