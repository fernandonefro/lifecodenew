import { z } from 'zod';
export declare const GLUCOSE_LOINC_CODE = "15074-8";
export declare const GLUCOSE_UCUM_MG_DL = "mg/dL";
export declare const GLUCOSE_UCUM_MMOL_L = "mmol/L";
export declare const glucoseIngestionSchema: any;
export type GlucoseIngestionDTO = z.input<typeof glucoseIngestionSchema>;
export type GlucoseIngestionProcessedDTO = z.output<typeof glucoseIngestionSchema>;
