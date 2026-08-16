-- ROLLBACK do rascunho (colunas são totalmente reversíveis).
DROP INDEX IF EXISTS "alerts_dedup_idx";

ALTER TABLE "alerts" DROP COLUMN IF EXISTS "alertDomain";
ALTER TABLE "alerts" DROP COLUMN IF EXISTS "alertSubtype";
ALTER TABLE "alerts" DROP COLUMN IF EXISTS "ruleCode";
ALTER TABLE "alerts" DROP COLUMN IF EXISTS "ruleVersion";
ALTER TABLE "alerts" DROP COLUMN IF EXISTS "careGapId";
ALTER TABLE "alerts" DROP COLUMN IF EXISTS "sourceEntityType";
ALTER TABLE "alerts" DROP COLUMN IF EXISTS "sourceEntityId";
ALTER TABLE "alerts" DROP COLUMN IF EXISTS "riskProfileCode";
ALTER TABLE "alerts" DROP COLUMN IF EXISTS "riskProfileVersion";
ALTER TABLE "alerts" DROP COLUMN IF EXISTS "riskProfileCapturedAt";
ALTER TABLE "alerts" DROP COLUMN IF EXISTS "episodeKey";

-- ATENÇÃO: valores de enum adicionados (IN_PROGRESS, ESCALATED, CANCELLED) NÃO são removíveis
-- via comando simples no PostgreSQL. Reverter exige recriar o tipo "AlertStatus" e recriar a
-- coluna "status" que o utiliza — operação separada e cuidadosa (fora deste rollback trivial).
