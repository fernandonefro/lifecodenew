# RASCUNHO de migração — Taxonomia/proveniência de regras no Alert (ADR-0002)

> **NÃO APLICADO. NÃO faz parte do chain de migrações.** Está em `prisma/drafts/`, portanto
> `prisma migrate deploy` (usado no CI) **NÃO** o executa. É material para revisão.

## O que faz
Adiciona ao `Alert` (tabela `alerts`) colunas **aditivas, nullable e reversíveis** para carregar
a taxonomia e a proveniência da regra que gerou o alerta, além da referência ao `CareGap`
(fonte-da-verdade), do snapshot de contexto de risco e da chave de episódio para deduplicação.
Adiciona também estados de incidente ao enum `AlertStatus` (`IN_PROGRESS`, `ESCALATED`, `CANCELLED`).

- `migration.sql` — SQL aditivo (não faz backfill, não altera linhas existentes).
- `rollback.sql` — reverte as colunas/índice (colunas 100% reversíveis; ver caveat de enum).
- `schema.additions.prisma` — trecho a mesclar no schema canônico ao promover.

## Por que ainda não foi aplicado
As colunas só passam a ser **usadas** quando regras candidatas forem **ativadas** — o que está
**bloqueado** (exige Comitê Clínico + parecer regulatório + `RELEASE_APPROVED`, ver ADR-0002).
O modo SHADOW atual **não** persiste nestas colunas (registro desidentificado). Aplicar agora
seria estrutura ociosa no banco clínico e criaria drift schema↔DB. Por isso: rascunho para revisão.

## Como PROMOVER (quando autorizado)
1. Mesclar `schema.additions.prisma` no `packages/database/prisma/schema.prisma` canônico.
2. Gerar a migração oficial: `pnpm --filter @lifecode/database prisma migrate dev --name alert_rule_taxonomy`
   (com Postgres de pé). **Separe** as adições de enum (`ALTER TYPE ADD VALUE`) das colunas se o
   PostgreSQL reclamar de transação.
3. `pnpm db:generate` para atualizar o Prisma Client.
4. Revisar o SQL gerado contra este rascunho.
5. `prisma migrate deploy` nos ambientes.

## Caveats
- `ALTER TYPE ... ADD VALUE` pode não rodar dentro de transação em PostgreSQL antigo.
- Remoção de valores de enum **não** é trivial (exige recriar o tipo). Ver `rollback.sql`.
- Reconciliar o `prisma/schema.prisma` **da raiz** (stale) — dívida registrada no ADR-0001/0002.
