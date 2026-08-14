import { z } from 'zod';

// IMPORTANTE: estes enums DEVEM espelhar exatamente os do Prisma
// (packages/database/prisma/schema.prisma), que é a fonte da verdade do banco.
// Antes divergiam: RiskTier estava INVERTIDO (TIER_3 = alto) e CareGapType usava
// nomes diferentes — o que causava classificação de risco e filtros incorretos.
export enum RiskTier {
  TIER_1_HIGH = 'TIER_1_HIGH',
  TIER_2_MODERATE = 'TIER_2_MODERATE',
  TIER_3_LOW = 'TIER_3_LOW'
}

export enum CareGapType {
  HBA1C_OVERDUE = 'HBA1C_OVERDUE',
  EGFR_OVERDUE = 'EGFR_OVERDUE',
  RETINA_EXAM_OVERDUE = 'RETINA_EXAM_OVERDUE',
  FOOT_EXAM_OVERDUE = 'FOOT_EXAM_OVERDUE',
  PHYSICIAN_VISIT_OVERDUE = 'PHYSICIAN_VISIT_OVERDUE'
}

export const operatorMetricsFilterSchema = z.object({
  tenantId: z.string().uuid().optional(),
  riskTier: z.nativeEnum(RiskTier).optional(),
  gapType: z.nativeEnum(CareGapType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type OperatorMetricsFilterDTO = z.infer<typeof operatorMetricsFilterSchema>;
