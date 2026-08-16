-- RASCUNHO — NÃO APLICADO. Fora do chain de migrações (prisma migrate deploy NÃO o executa).
-- Migração ADITIVA, NULLABLE e REVERSÍVEL (colunas) para a taxonomia/proveniência de regras (ADR-0002).
-- Não faz backfill. Não altera nenhuma linha existente. Não é usada até a ativação de regras (bloqueada).
--
-- CAVEAT PostgreSQL: `ALTER TYPE ... ADD VALUE` não pode rodar dentro de um bloco de transação
-- em versões antigas. Prisma envolve migrações em transação — ao promover, gerar as adições de
-- enum em uma migração SEPARADA das colunas, ou usar a flag apropriada.

-- 1) Colunas de proveniência/taxonomia no Alert (todas NULLABLE).
ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "alertDomain" TEXT;
ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "alertSubtype" TEXT;
ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "ruleCode" TEXT;
ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "ruleVersion" TEXT;

-- 2) Referência à lacuna assistencial (CareGap é a fonte-da-verdade; alerta apenas referencia).
ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "careGapId" UUID;
ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "sourceEntityType" TEXT;
ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "sourceEntityId" UUID;

-- 3) Snapshot de contexto de risco (imutável; capturado no momento da decisão).
ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "riskProfileCode" TEXT;
ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "riskProfileVersion" TEXT;
ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "riskProfileCapturedAt" TIMESTAMPTZ(6);

-- 4) Deduplicação de incidentes.
ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "episodeKey" TEXT;

-- 5) Índice de deduplicação/roteamento (não único; a unicidade de episódio é lógica).
CREATE INDEX IF NOT EXISTS "alerts_dedup_idx"
  ON "alerts" ("tenantId", "patientId", "ruleCode", "ruleVersion");

-- 6) Estados adicionais do ciclo de vida de incidente (ADITIVO ao enum AlertStatus).
--    Ver caveat de transação acima ao promover.
ALTER TYPE "AlertStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE "AlertStatus" ADD VALUE IF NOT EXISTS 'ESCALATED';
ALTER TYPE "AlertStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
