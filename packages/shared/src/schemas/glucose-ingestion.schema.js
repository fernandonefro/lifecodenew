"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.glucoseIngestionSchema = exports.GLUCOSE_UCUM_MMOL_L = exports.GLUCOSE_UCUM_MG_DL = exports.GLUCOSE_LOINC_CODE = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
exports.GLUCOSE_LOINC_CODE = '15074-8';
exports.GLUCOSE_UCUM_MG_DL = 'mg/dL';
exports.GLUCOSE_UCUM_MMOL_L = 'mmol/L';
exports.glucoseIngestionSchema = zod_1.z.object({
    schemaVersion: zod_1.z.string().default('1.0'),
    patientId: zod_1.z.string().uuid({ message: 'ID do paciente inválido (UUID).' }),
    externalEventId: zod_1.z.string().min(1, { message: 'ID externo de evento é obrigatório para idempotência.' }),
    value: zod_1.z.number()
        .min(10, { message: 'Valor abaixo do limite físico plausível (mínimo 10 mg/dL).' })
        .max(1000, { message: 'Valor acima do limite físico plausível (máximo 1000 mg/dL).' }),
    unit: zod_1.z.enum([exports.GLUCOSE_UCUM_MG_DL, exports.GLUCOSE_UCUM_MMOL_L], {
        errorMap: () => ({ message: 'Unidade deve ser mg/dL ou mmol/L (padrão UCUM).' })
    }).default(exports.GLUCOSE_UCUM_MG_DL),
    sourceType: zod_1.z.nativeEnum(enums_1.MeasurementSource, {
        errorMap: () => ({ message: 'Origem da medição é inválida.' })
    }),
    context: zod_1.z.nativeEnum(enums_1.MeasurementContext).optional().default(enums_1.MeasurementContext.RANDOM),
    deviceId: zod_1.z.string().optional(),
    measuredAt: zod_1.z.string().datetime({ message: 'Data e hora da medição devem estar no formato ISO 8601 UTC.' }),
    symptomsReported: zod_1.z.object({
        confusionOrAlteredConsciousness: zod_1.z.boolean().default(false),
        sweatingOrTremors: zod_1.z.boolean().default(false),
        vomitingOrKetoneSigns: zod_1.z.boolean().default(false),
    }).optional(),
    notes: zod_1.z.string().max(500, { message: 'Observações devem ter no máximo 500 caracteres.' }).optional()
})
    .transform((data) => {
    if (data.unit === exports.GLUCOSE_UCUM_MMOL_L) {
        return {
            ...data,
            value: Math.round(data.value * 18.0182),
            unit: exports.GLUCOSE_UCUM_MG_DL,
            originalValue: data.value,
            originalUnit: exports.GLUCOSE_UCUM_MMOL_L
        };
    }
    return data;
});
//# sourceMappingURL=glucose-ingestion.schema.js.map