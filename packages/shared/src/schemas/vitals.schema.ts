import { z } from 'zod';

export const vitalsSchema = z.object({
  systolicMmHg: z.number().min(50).max(300),
  diastolicMmHg: z.number().min(30).max(200),
  heartRateBpm: z.number().min(30).max(250).optional(),
  measuredAt: z.string().datetime(),
});

export type VitalsDTO = z.infer<typeof vitalsSchema>;
