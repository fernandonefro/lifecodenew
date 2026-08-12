import { z } from 'zod';
export declare enum RiskTier {
    TIER_3_HIGH = "TIER_3_HIGH",
    TIER_2_MODERATE = "TIER_2_MODERATE",
    TIER_1_LOW = "TIER_1_LOW"
}
export declare enum CareGapType {
    HBA1C_OVERDUE = "HBA1C_OVERDUE",
    RENAL_SCREENING_PENDING = "RENAL_SCREENING_PENDING",
    RETINOPATHY_SCREENING_PENDING = "RETINOPATHY_SCREENING_PENDING",
    FOOT_EXAM_PENDING = "FOOT_EXAM_PENDING",
    CONSULTATION_OVERDUE = "CONSULTATION_OVERDUE"
}
export declare const operatorMetricsFilterSchema: any;
export type OperatorMetricsFilterDTO = z.infer<typeof operatorMetricsFilterSchema>;
