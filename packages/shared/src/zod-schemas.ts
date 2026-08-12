import { z } from 'zod';

export const GlucoseReadingSchema = z.object({
  patientId: z.string().uuid(),
  timestamp: z.string().datetime(),
  valueMgDl: z.number().min(10, 'Limite fisiológico inferior').max(700, 'Limite fisiológico superior'),
  trendArrow: z.enum(['DOUBLE_DOWN', 'SINGLE_DOWN', 'FORTY_FIVE_DOWN', 'FLAT', 'FORTY_FIVE_UP', 'SINGLE_UP', 'DOUBLE_UP']).optional(),
  context: z.enum(['FASTING', 'PRE_PRANDIAL', 'POST_PRANDIAL', 'BEDTIME', 'NIGHT']).optional(),
  idempotencyKey: z.string().uuid(),
  deviceId: z.string().optional(),
});

export const BolusCalculationRequestSchema = z.object({
  patientId: z.string().uuid(),
  currentGlucoseMgDl: z.number().min(10).max(700),
  carbsGrams: z.number().min(0).max(300),
  activeInsulinIOB: z.number().min(0).default(0),
});

export type GlucoseReadingInput = z.infer<typeof GlucoseReadingSchema>;
export type BolusCalculationRequest = z.infer<typeof BolusCalculationRequestSchema>;
