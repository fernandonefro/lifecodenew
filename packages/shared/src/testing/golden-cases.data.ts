import { AlertSeverity, MeasurementContext, MeasurementSource } from '../enums';
import { GlucoseIngestionDTO } from '../schemas';

export interface GoldenTestCase {
  id: string;
  name: string;
  description: string;
  input: GlucoseIngestionDTO;
  expectedResult: {
    shouldTriggerAlert: boolean;
    expectedSeverity: AlertSeverity | null;
    expectedSlaMinutes: number | null; // 0 para imediato
    requiresImmediatePatientGuidance: boolean;
  };
}

export const GOLDEN_CLINICAL_TEST_CASES: GoldenTestCase[] = [
  {
    id: 'GOLDEN-01',
    name: 'Hipoglicemia Grave Seve (Nível 2) com Sintomas',
    description: 'Valor de glicose < 54 mg/dL associado a confusão/alteração de consciência. Exige P0 imediato.',
    input: {
      patientId: 'patient-golden-01',
      externalEventId: 'evt-golden-01',
      value: 42,
      unit: 'mg/dL',
      sourceType: MeasurementSource.MANUAL,
      context: MeasurementContext.FASTING,
      measuredAt: '2026-08-09T10:00:00.000Z',
      symptomsReported: {
        confusionOrAlteredConsciousness: true,
        sweatingOrTremors: true,
        vomitingOrKetoneSigns: false,
      },
    },
    expectedResult: {
      shouldTriggerAlert: true,
      expectedSeverity: AlertSeverity.P0_EMERGENCY,
      expectedSlaMinutes: 0, // Imediato
      requiresImmediatePatientGuidance: true,
    },
  },
  {
    id: 'GOLDEN-02',
    name: 'Hipoglicemia Moderada (Nível 1)',
    description: 'Valor de glicose entre 54 e 69 mg/dL sem alteração de consciência. Exige P1 (Alto Risco).',
    input: {
      patientId: 'patient-golden-02',
      externalEventId: 'evt-golden-02',
      value: 62,
      unit: 'mg/dL',
      sourceType: MeasurementSource.CAPILLARY,
      context: MeasurementContext.FASTING,
      measuredAt: '2026-08-09T10:05:00.000Z',
      symptomsReported: {
        confusionOrAlteredConsciousness: false,
        sweatingOrTremors: true,
        vomitingOrKetoneSigns: false,
      },
    },
    expectedResult: {
      shouldTriggerAlert: true,
      expectedSeverity: AlertSeverity.P1_HIGH_RISK,
      expectedSlaMinutes: 240, // 4 Horas (Mesmo dia)
      requiresImmediatePatientGuidance: false,
    },
  },
  {
    id: 'GOLDEN-03',
    name: 'Hiperglicemia Severa com Sintomas Cetonônicos',
    description: 'Glicemia > 300 mg/dL acompanhada de náuseas/vômitos (suspeita de CAD). Exige P0.',
    input: {
      patientId: 'patient-golden-03',
      externalEventId: 'evt-golden-03',
      value: 340,
      unit: 'mg/dL',
      sourceType: MeasurementSource.MANUAL,
      context: MeasurementContext.POST_PRANDIAL,
      measuredAt: '2026-08-09T10:10:00.000Z',
      symptomsReported: {
        confusionOrAlteredConsciousness: false,
        sweatingOrTremors: false,
        vomitingOrKetoneSigns: true,
      },
    },
    expectedResult: {
      shouldTriggerAlert: true,
      expectedSeverity: AlertSeverity.P0_EMERGENCY,
      expectedSlaMinutes: 0,
      requiresImmediatePatientGuidance: true,
    },
  },
  {
    id: 'GOLDEN-04',
    name: 'Glicemia Normal em Jejum (Dentro da Meta)',
    description: 'Valor de glicose 110 mg/dL sem sintomas. Não deve gerar alerta de risco.',
    input: {
      patientId: 'patient-golden-04',
      externalEventId: 'evt-golden-04',
      value: 110,
      unit: 'mg/dL',
      sourceType: MeasurementSource.CGM,
      context: MeasurementContext.FASTING,
      measuredAt: '2026-08-09T10:15:00.000Z',
    },
    expectedResult: {
      shouldTriggerAlert: false,
      expectedSeverity: null,
      expectedSlaMinutes: null,
      requiresImmediatePatientGuidance: false,
    },
  },
];
