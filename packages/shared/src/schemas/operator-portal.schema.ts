import { z } from 'zod';

export enum RiskTier {
  TIER_3_HIGH = 'TIER_3_HIGH',
  TIER_2_MODERATE = 'TIER_2_MODERATE',
  TIER_1_LOW = 'TIER_1_LOW'
}

export enum CareGapType {
  HBA1C_OVERDUE = 'HBA1C_OVERDUE',
  RENAL_SCREENING_PENDING = 'RENAL_SCREENING_PENDING',
  RETINOPATHY_SCREENING_PENDING = 'RETINOPATHY_SCREENING_PENDING',
  FOOT_EXAM_PENDING = 'FOOT_EXAM_PENDING',
  CONSULTATION_OVERDUE = 'CONSULTATION_OVERDUE'
}

export const operatorMetricsFilterSchema = z.object({
  tenantId: z.string().uuid().optional(),
  riskTier: z.nativeEnum(RiskTier).optional(),
  gapType: z.nativeEnum(CareGapType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type OperatorMetricsFilterDTO = z.infer<typeof operatorMetricsFilterSchema>;
