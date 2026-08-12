export type SeverityLevel = 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_LOW';

export type TrendArrow =
  | 'DOUBLE_DOWN'
  | 'SINGLE_DOWN'
  | 'FORTY_FIVE_DOWN'
  | 'FLAT'
  | 'FORTY_FIVE_UP'
  | 'SINGLE_UP'
  | 'DOUBLE_UP'
  | 'NOT_COMPUTABLE';

export type ClinicalSymptom =
  | 'SWEATING'
  | 'DIZZINESS'
  | 'CONFUSION'
  | 'NAUSEA'
  | 'KETONES_PRESENT'
  | 'TREMORS'
  | 'LETHARGY';

export interface PatientClinicalState {
  patientId: string;
  currentGlucoseMgDl: number;
  previousGlucoseMgDl?: number;
  trendArrow: TrendArrow;
  sustainedDurationMinutes: number;
  symptoms: ClinicalSymptom[];
  activeInsulinUnitsIOB: number;
  sensorConnected: boolean;
  sensorDisconnectionMinutes: number;
  lastReadingTimestamp: string;
}

export interface RuleEvaluationResult {
  triggeredSeverity: SeverityLevel;
  ruleId: string;
  ruleVersion: string;
  description: string;
  actionRequired: string;
  escalationRequired: boolean;
  overrideDoNotDisturb: boolean;
  isP0Emergency: boolean;
}

export class LifecodeClinicalRulesEngine {
  public static readonly ENGINE_VERSION = '2.1.0-SaMD';
  public static readonly ANVISA_RULESET_HASH = 'a5f8e91d8420c2912f90119b48c1f4e190382026';

  public evaluatePatientState(state: PatientClinicalState): RuleEvaluationResult {
    // P0.1: Hipoglicemia Nível 2 / Severa (< 54 mg/dL)
    if (state.currentGlucoseMgDl < 54 && state.sensorConnected) {
      return {
        triggeredSeverity: 'P0_CRITICAL',
        ruleId: 'RULE-P0-01-SEVERE-HYPO',
        ruleVersion: '1.0.0',
        description: 'HIPOGLICEMIA SEVERA DETECTADA (< 54 mg/dL). Risco neuroglicopênico iminente.',
        actionRequired: 'Ingerir 15-20g de carboidratos rápidos imediatamente. Alarme disparado.',
        escalationRequired: true,
        overrideDoNotDisturb: true,
        isP0Emergency: true,
      };
    }

    // P0.2: Hipoglicemia Iminente com Queda Rápida (< 70 mg/dL com Seta DOUBLE_DOWN)
    if (state.currentGlucoseMgDl < 70 && state.trendArrow === 'DOUBLE_DOWN' && state.sensorConnected) {
      return {
        triggeredSeverity: 'P0_CRITICAL',
        ruleId: 'RULE-P0-02-RAPID-DROP-HYPO',
        ruleVersion: '1.0.0',
        description: 'ALERTA DE QUEDA GLICÊMICA CRÍTICA (< 70 mg/dL em queda rápida > 3 mg/dL/min).',
        actionRequired: 'Ação imediata necessária para prevenir perda de consciência.',
        escalationRequired: true,
        overrideDoNotDisturb: true,
        isP0Emergency: true,
      };
    }

    // P0.3: Hiperglicemia Crítica com Suspeita de Cetoacidose (> 300 mg/dL sustentado > 120 min OU com Cetonas/Sintomas)
    if (
      state.currentGlucoseMgDl > 300 &&
      state.sensorConnected &&
      (state.sustainedDurationMinutes >= 120 ||
        state.symptoms.includes('KETONES_PRESENT') ||
        state.symptoms.includes('NAUSEA') ||
        state.symptoms.includes('CONFUSION'))
    ) {
      return {
        triggeredSeverity: 'P0_CRITICAL',
        ruleId: 'RULE-P0-03-DKA-RISK-HYPER',
        ruleVersion: '1.0.0',
        description: 'HIPERGLICEMIA CRÍTICA COM RISCO DE CETOACIDOSE (> 300 mg/dL com sintomas/tempo prolongado).',
        actionRequired: 'Avaliar cetonemia/cetonúria, aplicar bolus de correção e contatar médico.',
        escalationRequired: true,
        overrideDoNotDisturb: true,
        isP0Emergency: true,
      };
    }

    // P1.1: Hipoglicemia Nível 1 (54 mg/dL a 69 mg/dL)
    if (state.currentGlucoseMgDl >= 54 && state.currentGlucoseMgDl <= 69 && state.sensorConnected) {
      return {
        triggeredSeverity: 'P1_HIGH',
        ruleId: 'RULE-P1-01-MODERATE-HYPO',
        ruleVersion: '1.0.0',
        description: 'Glicemia Baixa (54-69 mg/dL).',
        actionRequired: 'Consumir 15g de carboidrato de rápida absorção e retestar em 15 min.',
        escalationRequired: true,
        overrideDoNotDisturb: true,
        isP0Emergency: false,
      };
    }

    // P1.2: Hiperglicemia Marcada (> 250 mg/dL com tendência de alta)
    if (
      state.currentGlucoseMgDl > 250 &&
      state.currentGlucoseMgDl <= 300 &&
      (state.trendArrow === 'SINGLE_UP' || state.trendArrow === 'DOUBLE_UP') &&
      state.sensorConnected
    ) {
      return {
        triggeredSeverity: 'P1_HIGH',
        ruleId: 'RULE-P1-02-HIGH-HYPER-RISING',
        ruleVersion: '1.0.0',
        description: 'Hiperglicemia Elevada em Alta (> 250 mg/dL subindo).',
        actionRequired: 'Checar calculadora de bolus para correção de dosagem.',
        escalationRequired: false,
        overrideDoNotDisturb: false,
        isP0Emergency: false,
      };
    }

    // P2.1: Hiperglicemia Leve Sustentada (180 mg/dL a 250 mg/dL por > 180 minutos)
    if (
      state.currentGlucoseMgDl >= 180 &&
      state.currentGlucoseMgDl <= 250 &&
      state.sustainedDurationMinutes >= 180 &&
      state.sensorConnected
    ) {
      return {
        triggeredSeverity: 'P2_MEDIUM',
        ruleId: 'RULE-P2-01-SUSTAINED-HIGH',
        ruleVersion: '1.0.0',
        description: 'Glicemia Acima da Meta Sustentada (180-250 mg/dL por mais de 3 horas).',
        actionRequired: 'Verificar ingestão recente de carboidratos e considerar correção.',
        escalationRequired: false,
        overrideDoNotDisturb: false,
        isP0Emergency: false,
      };
    }

    // P2.2: Perda de Conexão com o Sensor CGM (> 15 minutos)
    if (!state.sensorConnected || state.sensorDisconnectionMinutes > 15) {
      return {
        triggeredSeverity: 'P2_MEDIUM',
        ruleId: 'RULE-P2-02-SENSOR-DISCONNECTED',
        ruleVersion: '1.0.0',
        description: 'Sinal do Sensor CGM Perdido há mais de 15 minutos.',
        actionRequired: 'Aproxime o celular do sensor ou verifique se o Bluetooth está ativo.',
        escalationRequired: false,
        overrideDoNotDisturb: false,
        isP0Emergency: false,
      };
    }

    // P3.1: Glicemia no Alvo (70 mg/dL a 180 mg/dL - TIR)
    return {
      triggeredSeverity: 'P3_LOW',
      ruleId: 'RULE-P3-01-IN-TARGET',
      ruleVersion: '1.0.0',
      description: 'Glicemia no Alvo (Time in Range 70-180 mg/dL).',
      actionRequired: 'Manter monitoramento rotineiro.',
      escalationRequired: false,
      overrideDoNotDisturb: false,
      isP0Emergency: false,
    };
  }
}
