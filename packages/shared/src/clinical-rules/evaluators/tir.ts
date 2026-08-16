/**
 * Avaliador PURO de métricas longitudinais (TIR/TBR/TAR) sobre uma janela.
 *
 * TIR é uma métrica longitudinal INDIVIDUAL — NUNCA derivada de uma leitura isolada.
 * Janela padrão 14 dias; exige >=70% de dados válidos. Abaixo disso, não abrir care gap de
 * TIR (insuficiência de dados é tratada separadamente). Ver docs/adr/ADR-0002.
 */

export const TIR_WINDOW_DAYS_DEFAULT = 14;
export const TIR_MIN_VALID_FRACTION_DEFAULT = 0.7;
export const TIR_RANGE_LOWER_MGDL = 70;
export const TIR_RANGE_UPPER_MGDL = 180;

export interface TirTargets {
  /** Meta de TIR (fração 0..1). Padrão candidato 0.70; idoso/alto risco 0.50. */
  tirTargetFraction: number;
  rangeLowerMgDl?: number;
  rangeUpperMgDl?: number;
}

export interface TirInput {
  /** Leituras válidas de glicemia (mg/dL) já filtradas para a janela. */
  validReadingsMgDl: number[];
  /** Número esperado de leituras na janela (para a fração de dados válidos). */
  expectedReadingsCount: number;
  minValidFraction?: number;
}

export interface TirResult {
  validDataFraction: number;
  insufficientData: boolean;
  tirFraction: number;
  tbrBelow70Fraction: number;
  tbrBelow54Fraction: number;
  tarAbove250Fraction: number;
  /** true somente se dados suficientes E TIR abaixo da meta. */
  belowTarget: boolean;
}

export function evaluateTir(input: TirInput, targets: TirTargets): TirResult {
  const minValid = input.minValidFraction ?? TIR_MIN_VALID_FRACTION_DEFAULT;
  const lower = targets.rangeLowerMgDl ?? TIR_RANGE_LOWER_MGDL;
  const upper = targets.rangeUpperMgDl ?? TIR_RANGE_UPPER_MGDL;

  const n = input.validReadingsMgDl.length;
  const validDataFraction =
    input.expectedReadingsCount > 0 ? n / input.expectedReadingsCount : 0;
  const insufficientData = validDataFraction < minValid;

  const frac = (pred: (g: number) => boolean) =>
    n > 0 ? input.validReadingsMgDl.filter(pred).length / n : 0;

  const tirFraction = frac((g) => g >= lower && g <= upper);
  const tbrBelow70Fraction = frac((g) => g < 70);
  const tbrBelow54Fraction = frac((g) => g < 54);
  const tarAbove250Fraction = frac((g) => g > 250);

  // Insuficiência de dados NUNCA abre care gap de TIR.
  const belowTarget = !insufficientData && tirFraction < targets.tirTargetFraction;

  return {
    validDataFraction,
    insufficientData,
    tirFraction,
    tbrBelow70Fraction,
    tbrBelow54Fraction,
    tarAbove250Fraction,
    belowTarget,
  };
}
