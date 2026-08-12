import { LifecodeClinicalRulesEngine, PatientClinicalState } from './clinical_rules_engine';

describe('Lifecode Clinical Rules Engine - 5 Golden Test Cases (Casos-Ouro)', () => {
  let engine: LifecodeClinicalRulesEngine;

  beforeEach(() => {
    engine = new LifecodeClinicalRulesEngine();
  });

  test('Caso-Ouro 01 [P0 EMERGENCY]: Glicemia = 42 mg/dL (Nível 2) deve disparar P0_CRITICAL imediatamente sem exceções', () => {
    const syntheticPatient: PatientClinicalState = {
      patientId: 'pat_gold_01',
      currentGlucoseMgDl: 42,
      trendArrow: 'SINGLE_DOWN',
      sustainedDurationMinutes: 5,
      symptoms: ['SWEATING', 'CONFUSION'],
      activeInsulinUnitsIOB: 2.5,
      sensorConnected: true,
      sensorDisconnectionMinutes: 0,
      lastReadingTimestamp: '2026-08-09T21:40:00Z',
    };

    const result = engine.evaluatePatientState(syntheticPatient);

    expect(result.triggeredSeverity).toBe('P0_CRITICAL');
    expect(result.isP0Emergency).toBe(true);
    expect(result.overrideDoNotDisturb).toBe(true);
    expect(result.escalationRequired).toBe(true);
    expect(result.ruleId).toBe('RULE-P0-01-SEVERE-HYPO');
  });

  test('Caso-Ouro 02 [P0 EMERGENCY]: Glicemia = 64 mg/dL com Seta DOUBLE_DOWN deve ser promovida para P0_CRITICAL', () => {
    const syntheticPatient: PatientClinicalState = {
      patientId: 'pat_gold_02',
      currentGlucoseMgDl: 64,
      trendArrow: 'DOUBLE_DOWN',
      sustainedDurationMinutes: 2,
      symptoms: ['TREMORS'],
      activeInsulinUnitsIOB: 3.8,
      sensorConnected: true,
      sensorDisconnectionMinutes: 0,
      lastReadingTimestamp: '2026-08-09T21:40:00Z',
    };

    const result = engine.evaluatePatientState(syntheticPatient);

    expect(result.triggeredSeverity).toBe('P0_CRITICAL');
    expect(result.isP0Emergency).toBe(true);
    expect(result.overrideDoNotDisturb).toBe(true);
    expect(result.ruleId).toBe('RULE-P0-02-RAPID-DROP-HYPO');
  });

  test('Caso-Ouro 03 [P0 EMERGENCY]: Glicemia = 340 mg/dL com Nausea e Cetonas deve disparar P0_CRITICAL (Risco CAD)', () => {
    const syntheticPatient: PatientClinicalState = {
      patientId: 'pat_gold_03',
      currentGlucoseMgDl: 340,
      trendArrow: 'SINGLE_UP',
      sustainedDurationMinutes: 150,
      symptoms: ['NAUSEA', 'KETONES_PRESENT'],
      activeInsulinUnitsIOB: 0.2,
      sensorConnected: true,
      sensorDisconnectionMinutes: 0,
      lastReadingTimestamp: '2026-08-09T21:40:00Z',
    };

    const result = engine.evaluatePatientState(syntheticPatient);

    expect(result.triggeredSeverity).toBe('P0_CRITICAL');
    expect(result.isP0Emergency).toBe(true);
    expect(result.escalationRequired).toBe(true);
    expect(result.ruleId).toBe('RULE-P0-03-DKA-RISK-HYPER');
  });

  test('Caso-Ouro 04 [P1 HIGH]: Glicemia = 62 mg/dL estável (FLAT) deve disparar alerta P1_HIGH', () => {
    const syntheticPatient: PatientClinicalState = {
      patientId: 'pat_gold_04',
      currentGlucoseMgDl: 62,
      trendArrow: 'FLAT',
      sustainedDurationMinutes: 10,
      symptoms: [],
      activeInsulinUnitsIOB: 0.5,
      sensorConnected: true,
      sensorDisconnectionMinutes: 0,
      lastReadingTimestamp: '2026-08-09T21:40:00Z',
    };

    const result = engine.evaluatePatientState(syntheticPatient);

    expect(result.triggeredSeverity).toBe('P1_HIGH');
    expect(result.isP0Emergency).toBe(false);
    expect(result.ruleId).toBe('RULE-P1-01-MODERATE-HYPO');
  });

  test('Caso-Ouro 05 [P3 LOW]: Glicemia = 115 mg/dL no alvo (TIR 70-180 mg/dL) deve classificar como P3_LOW', () => {
    const syntheticPatient: PatientClinicalState = {
      patientId: 'pat_gold_05',
      currentGlucoseMgDl: 115,
      trendArrow: 'FLAT',
      sustainedDurationMinutes: 180,
      symptoms: [],
      activeInsulinUnitsIOB: 1.0,
      sensorConnected: true,
      sensorDisconnectionMinutes: 0,
      lastReadingTimestamp: '2026-08-09T21:40:00Z',
    };

    const result = engine.evaluatePatientState(syntheticPatient);

    expect(result.triggeredSeverity).toBe('P3_LOW');
    expect(result.isP0Emergency).toBe(false);
    expect(result.escalationRequired).toBe(false);
    expect(result.ruleId).toBe('RULE-P3-01-IN-TARGET');
  });
});
