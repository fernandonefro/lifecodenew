import { z } from 'zod';
export declare const vitalsSchema: any;
export type VitalsDTO = z.infer<typeof vitalsSchema>;
