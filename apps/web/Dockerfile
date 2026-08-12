# STAGE 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml .npmrc ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN pnpm install

RUN pnpm --filter @lifecode/shared build

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @lifecode/web build

# Garante que a pasta public existe mesmo que vazia
RUN mkdir -p /app/apps/web/public

# STAGE 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S lifecode && adduser -S lifecode -G lifecode

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER lifecode

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "apps/web/server.js"]
