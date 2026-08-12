# PENDÊNCIAS — O que não pôde ser resolvido e por quê

> Gerado em: 2026-08-12. Itens abertos após execução real de todos os comandos e leitura de todos os arquivos pertinentes.

---

## P1 — Build Docker do `lifecode-web` não confirmado nesta sessão

**Status**: ⚠️ Incerto  
**Motivo**: Docker Desktop estava fechado na máquina durante a execução desta sessão de verificação. O comando `docker compose -f docker-compose.prod.yml build` falhou com:
```
failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine;
check if the path is correct and if the daemon is running:
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```
**O que foi confirmado em sessão anterior (2026-08-10)**: O build da `lifecode-api` passou (`DONE`). A correção do build do `lifecode-web` (pasta `public` ausente) foi aplicada no Dockerfile — resultado não confirmado.

**Para fechar**: Abrir Docker Desktop e rodar:
```powershell
docker compose -f docker-compose.prod.yml build --no-cache --progress=plain 2>&1 | Select-String -Pattern "error TS|DONE|ERROR|FAILED"
```

---

## P2 — `pnpm build` travou em `Collecting build traces` (Turborepo + Windows)

**Status**: ⚠️ Incerto para `@lifecode/api` e `@lifecode/mobile`  
**Motivo**: O processo `turbo run build` travou na etapa final do Next.js build (`Collecting build traces`) após ~3 minutos sem progresso — comportamento conhecido do Turborepo no Windows com builds grandes. Foi cancelado manualmente.

**O que foi confirmado antes do cancelamento**:
- `@lifecode/shared` (tsc) ✅
- `@lifecode/database` (prisma generate) ✅
- `@lifecode/web` (next build) ✅ — compilou e gerou 6/6 páginas
- `@lifecode/api` (tsc) ⚠️ — iniciado, sem output antes do cancelamento
- `@lifecode/mobile` — não apareceu (sem script `build` no `package.json`)

**Para fechar**: Rodar cada pacote isoladamente para confirmar:
```powershell
pnpm --filter @lifecode/api build
pnpm --filter @lifecode/web build
```

---

## P3 — `pnpm test` não roda nenhum teste

**Status**: ❌ Confirmado quebrado  
**Erro real**:
```
Error:   x could not find task `test` in project
```
**Causa raiz confirmada**: O `turbo.json` não define a pipeline `test`. O script `"test": "jest"` existe em `apps/api/package.json` mas o Turborepo não sabe como executá-lo.

**Para fechar**: Adicionar ao `turbo.json`:
```json
{
  "pipeline": {
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
```
Depois verificar se os testes unitários em `apps/api/src/modules/observations/glucose.service.spec.ts` passam com `pnpm --filter @lifecode/api test`.

---

## P4 — `.gitignore` ausente — CRÍTICO DE SEGURANÇA

**Status**: ✅ Corrigido nesta sessão  
**O que aconteceu**: O arquivo `.gitignore` não existia no repositório. O arquivo `.env` com segredos (`JWT_SECRET`, `FIELD_ENCRYPTION_KEY`, senhas do banco) poderia ser incluído em um `git commit` acidentalmente.

**Correção aplicada**: `.gitignore` criado na raiz com:
```
.env
node_modules
dist
.next
.turbo
*.log
pnpm-debug.log*
```

**Ação pendente do time**: Verificar se o `.env` já foi commitado em algum commit anterior via `git log --all --full-history -- .env`. Se sim, fazer um `git filter-branch` ou `git filter-repo` para remover do histórico e **rotacionar todas as credenciais**.

---

## P5 — `apps/mobile` sem script `build` no `package.json`

**Status**: ⚠️ Incerto (pode ser intencional)  
**Observação**: `apps/mobile/package.json` não tem script `"build"`. O Turborepo simplesmente pula o mobile no `pnpm build`. Para apps Expo, o build de produção é feito via `eas build` (Expo Application Services) — provavelmente intencional, mas não está documentado em nenhum lugar.

**Para fechar**: Confirmar se o build mobile é via EAS e documentar o comando em `CLAUDE.md`.

---

## P6 — Peer dependency warnings não resolvidos

**Status**: ⚠️ Não bloqueante, mas pode causar bugs em runtime  
**Warnings confirmados** no `pnpm install`:
```
apps/web
└─┬ react-dom 18.3.1
  └── ✕ unmet peer react@^18.3.1: found 18.2.0

packages/shared
└─┬ date-fns-tz 2.0.1
  └── ✕ unmet peer date-fns@2.x: found 3.6.0
```
**Para fechar**:
- Atualizar `react` para `18.3.1` em `apps/web/package.json` (ou fixar `react-dom` em `18.2.0`)
- Atualizar `date-fns-tz` para `^3.0.0` em `packages/shared/package.json`

---

## P7 — `pnpm-lock.yaml` não commitado

**Status**: ⚠️ Aberto  
**Causa**: O lockfile nunca foi gerado/commitado. Isso significa que `pnpm install --frozen-lockfile` (usado em CI/CD e Dockerfiles com `--frozen-lockfile`) pode falhar ou instalar versões diferentes das esperadas.

**Para fechar**: Rodar `pnpm install` localmente (já passa) e commitar o `pnpm-lock.yaml` gerado. Revisar o `.gitignore` para garantir que não está excluindo o lockfile.

---

## Resumo Executivo para o Próximo Dev

| # | Item | Criticidade | Ação |
|---|---|---|---|
| P1 | Build Docker web não confirmado | 🔴 Alta | Abrir Docker Desktop e rodar build |
| P2 | `pnpm build` da API não confirmado | 🟡 Média | Rodar `pnpm --filter @lifecode/api build` |
| P3 | `pnpm test` quebrado | 🟡 Média | Adicionar `test` ao `turbo.json` |
| P4 | `.gitignore` ausente | 🔴 CRÍTICO | ✅ Corrigido — verificar histórico git |
| P5 | Mobile sem script `build` | 🟢 Baixa | Confirmar se é intencional (EAS) |
| P6 | Peer dependency warnings | 🟢 Baixa | Atualizar versões de react e date-fns-tz |
| P7 | Sem `pnpm-lock.yaml` | 🟡 Média | Commitar após `pnpm install` |
