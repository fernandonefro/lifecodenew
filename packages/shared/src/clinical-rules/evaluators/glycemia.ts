import { AlertSubtype } from '../alert-subtype.enum';

/**
 * Avaliadores PUROS de glicemia — apenas CLASSIFICAM (roteiam) o significado clínico.
 * Não emitem, não persistem, não notificam. A emissão depende do gate de governança e do
 * status DRAFT/DISABLED das regras (ver governance-gate.ts).
 *
 * Constantes de limiar de NÍVEL (54/70) seguem a classificação ADA. Constantes de DURAÇÃO
 * e de sintoma são parâmetros de PRODUTO (DRAFT) — ver docs/adr/ADR-0002.
 */

// --- Limiares de nível (ADA) ---
export const HYPO_LEVEL1_LOWER_MGDL = 54; // >=54 e <70 → nível 1
export const HYPO_UPPER_MGDL = 70; // >=70 não é hipoglicemia
export const HYPER_MARKED_LOWER_MGDL = 250; // > 250 → faixa "marcada"
export const HYPER_SUSTAINED_LOWER_MGDL = 180; // > 180 e <= 250 → faixa "sustentada"

// --- Parâmetros candidatos (DRAFT) ---
export const DKA_BETA_OHB_MMOL_DRAFT = 3; // beta-hidroxibutirato >= 3 mmol/L
export const DKA_URINE_KETONES_PLUS_DRAFT = 2; // cetona urinária >= 2+
export const DKA_SYMPTOM_HYPERGLYCEMIA_MGDL_DRAFT = 250; // hiperglicemia p/ ramo sintomático

export interface GlycemiaReadingInput {
  glucoseMgDl: number;
  /** Sensor/leitura válida. Se false, NÃO gerar evento clínico glicêmico (ausência de dado ≠ evento). */
  sensorValid: boolean;
  // Cetonas (laboratoriais — independentes da validade do sensor CGM).
  betaHydroxybutyrateMmol?: number;
  urineKetonesPlus?: number; // 0..4
  // Marcadores de nível 3 (evento grave exigindo ajuda de terceiros).
  needsThirdPartyAssistance?: boolean;
  seizure?: boolean;
  // Sintomas do ramo sintomático de suspeita de DKA.
  persistentVomiting?: boolean;
  abdominalPain?: boolean;
  abnormalBreathing?: boolean;
  drowsiness?: boolean;
  confusion?: boolean;
}

/**
 * Classifica hipoglicemia em níveis com precedência LEVEL3 > LEVEL2 > LEVEL1.
 * Nível 3 é independente do valor (evento grave). Sensor inválido, sem marcador de nível 3,
 * não gera evento.
 */
export function classifyHypoglycemia(input: GlycemiaReadingInput): AlertSubtype | null {
  if (input.needsThirdPartyAssistance === true || input.seizure === true) {
    return AlertSubtype.HYPOGLYCEMIA_LEVEL_3;
  }
  if (!input.sensorValid) return null;
  if (input.glucoseMgDl < HYPO_LEVEL1_LOWER_MGDL) return AlertSubtype.HYPOGLYCEMIA_LEVEL_2;
  if (input.glucoseMgDl < HYPO_UPPER_MGDL) return AlertSubtype.HYPOGLYCEMIA_LEVEL_1;
  return null;
}

export interface DkaAssessment {
  suspected: boolean;
  reason?: 'BETA_OHB' | 'URINE_KETONES' | 'HYPERGLYCEMIA_SYMPTOMS';
}

/**
 * Avalia SUSPEITA de cetoacidose (nunca "diagnóstico"). Não exige glicemia > 300;
 * DKA pode ocorrer com glicemia menor, especialmente em uso de SGLT2.
 */
export function assessDkaSuspicion(input: GlycemiaReadingInput): DkaAssessment {
  if ((input.betaHydroxybutyrateMmol ?? 0) >= DKA_BETA_OHB_MMOL_DRAFT) {
    return { suspected: true, reason: 'BETA_OHB' };
  }
  if ((input.urineKetonesPlus ?? 0) >= DKA_URINE_KETONES_PLUS_DRAFT) {
    return { suspected: true, reason: 'URINE_KETONES' };
  }
  const hasSymptom =
    input.persistentVomiting ||
    input.abdominalPain ||
    input.abnormalBreathing ||
    input.drowsiness ||
    input.confusion;
  if (
    input.sensorValid &&
    input.glucoseMgDl > DKA_SYMPTOM_HYPERGLYCEMIA_MGDL_DRAFT &&
    hasSymptom
  ) {
    return { suspected: true, reason: 'HYPERGLYCEMIA_SYMPTOMS' };
  }
  return { suspected: false };
}

/**
 * Classificação (roteamento) de UMA leitura para o subtipo clínico.
 * Precedência global: hipoglicemia (nível 3/2/1) → SUSPECTED_DKA → hiper marcada/sustentada (roteamento).
 * NÃO decide emissão nem duração — apenas a natureza clínica.
 */
export function classifyGlycemiaReading(input: GlycemiaReadingInput): AlertSubtype | null {
  const hypo = classifyHypoglycemia(input);
  if (hypo) return hypo;

  if (assessDkaSuspicion(input).suspected) return AlertSubtype.SUSPECTED_DKA;

  if (!input.sensorValid) return null;
  if (input.glucoseMgDl > HYPER_MARKED_LOWER_MGDL) return AlertSubtype.HYPERGLYCEMIA_MARKED;
  if (input.glucoseMgDl > HYPER_SUSTAINED_LOWER_MGDL) return AlertSubtype.HYPERGLYCEMIA_SUSTAINED;
  return null; // 70–180 (e demais): apenas armazenar; nunca P3 por leitura isolada.
}

// ---------------------------------------------------------------------------
// Avaliação por DURAÇÃO (hiper marcada v2 / sustentada) — sobre uma série de leituras.
// Durações são derivadas de timestamps no backend; nunca fornecidas pelo cliente.
// ---------------------------------------------------------------------------

export interface TimedReading {
  /** Minutos relativos ao início do episódio (derivado de timestamps ordenados). */
  tMinutes: number;
  glucoseMgDl: number;
  valid: boolean;
}

export interface SustainedHyperParams {
  markedSustainMinutes: number; // ex.: 60 (DRAFT)
  sustainedMinutes: number; // ex.: 180 (DRAFT)
  /** Gap máximo tolerado entre leituras válidas; acima disso, a continuidade é interrompida. */
  maxGapMinutes: number;
}

/** Maior duração contínua (min) em que as leituras válidas satisfazem `inBand`, respeitando gaps. */
export function longestSustainedMinutes(
  series: TimedReading[],
  inBand: (g: number) => boolean,
  maxGapMinutes: number,
): number {
  const valid = series.filter((r) => r.valid).sort((a, b) => a.tMinutes - b.tMinutes);
  let best = 0;
  let runStart: number | null = null;
  let prevT: number | null = null;
  for (const r of valid) {
    const matches = inBand(r.glucoseMgDl);
    const gapTooBig = prevT !== null && r.tMinutes - prevT > maxGapMinutes;
    if (matches && !gapTooBig && runStart !== null) {
      best = Math.max(best, r.tMinutes - runStart);
    } else if (matches) {
      runStart = r.tMinutes; // (re)inicia a corrida
    } else {
      runStart = null; // fora da faixa quebra a corrida
    }
    prevT = r.tMinutes;
  }
  return best;
}

/**
 * Avalia a série e retorna MARKED (v2), SUSTAINED ou null, com precedência MARKED > SUSTAINED.
 * Uma leitura isolada não satisfaz a duração e retorna null.
 */
export function evaluateSustainedHyperglycemia(
  series: TimedReading[],
  params: SustainedHyperParams,
): AlertSubtype | null {
  const markedDur = longestSustainedMinutes(
    series,
    (g) => g > HYPER_MARKED_LOWER_MGDL,
    params.maxGapMinutes,
  );
  if (markedDur >= params.markedSustainMinutes) return AlertSubtype.HYPERGLYCEMIA_MARKED;

  const sustainedDur = longestSustainedMinutes(
    series,
    (g) => g > HYPER_SUSTAINED_LOWER_MGDL && g <= HYPER_MARKED_LOWER_MGDL,
    params.maxGapMinutes,
  );
  if (sustainedDur >= params.sustainedMinutes) return AlertSubtype.HYPERGLYCEMIA_SUSTAINED;

  return null;
}
