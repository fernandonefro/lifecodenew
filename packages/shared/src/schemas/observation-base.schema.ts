import { z } from 'zod';

export const observationBaseSchema = z.object({
  schemaVersion: z.string().default('1.0'),
  patientId: z.string().uuid(),
  externalEventId: z.string().min(1),
  loincCode: z.string().min(1),
  value: z.number(),
  unit: z.string(),
  measuredAt: z.string().datetime(),
  deviceId: z.string().optional(),
  notes: z.string().optional(),
});
