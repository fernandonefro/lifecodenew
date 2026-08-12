import { z } from 'zod';
import { MeasurementSource, MeasurementContext } from '../enums';

export const GLUCOSE_LOINC_CODE = '15074-8';
export const GLUCOSE_UCUM_MG_DL = 'mg/dL';
export const GLUCOSE_UCUM_MMOL_L = 'mmol/L';

export const glucoseIngestionSchema = z.object({
  schemaVersion: z.string().default('1.0'),
  patientId: z.string().uuid({ message: 'ID do paciente inválido (UUID).' }),
  externalEventId: z.string().min(1, { message: 'ID externo de evento é obrigatório para idempotência.' }),

  // Valor e Unidade com Validação de Faixa Plausível (CA-04)
  value: z.number()
    .min(10, { message: 'Valor abaixo do limite físico plausível (mínimo 10 mg/dL).' })
    .max(1000, { message: 'Valor acima do limite físico plausível (máximo 1000 mg/dL).' }),

  unit: z.enum([GLUCOSE_UCUM_MG_DL, GLUCOSE_UCUM_MMOL_L], {
    errorMap: () => ({ message: 'Unidade deve ser mg/dL ou mmol/L (padrão UCUM).' })
  }).default(GLUCOSE_UCUM_MG_DL),

  sourceType: z.nativeEnum(MeasurementSource, {
    errorMap: () => ({ message: 'Origem da medição é inválida.' })
  }),

  context: z.nativeEnum(MeasurementContext).optional().default(MeasurementContext.RANDOM),

  // Proveniência e Auditoria (CA-03, Seção 8.3)
  deviceId: z.string().optional(),
  measuredAt: z.string().datetime({ message: 'Data e hora da medição devem estar no formato ISO 8601 UTC.' }),

  // Sinalização de sintomas de emergência relatados pelo paciente
  symptomsReported: z.object({
    confusionOrAlteredConsciousness: z.boolean().default(false),
    sweatingOrTremors: z.boolean().default(false),
    vomitingOrKetoneSigns: z.boolean().default(false),
  }).optional(),

  notes: z.string().max(500, { message: 'Observações devem ter no máximo 500 caracteres.' }).optional()
})
// Conversão Automática de mmol/L para mg/dL via Transform
.transform((data) => {
  if (data.unit === GLUCOSE_UCUM_MMOL_L) {
    return {
      ...data,
      value: Math.round(data.value * 18.0182),
      unit: GLUCOSE_UCUM_MG_DL,
      originalValue: data.value,
      originalUnit: GLUCOSE_UCUM_MMOL_L
    };
  }
  return data;
});

export type GlucoseIngestionDTO = z.input<typeof glucoseIngestionSchema>;
export type GlucoseIngestionProcessedDTO = z.output<typeof glucoseIngestionSchema>;
