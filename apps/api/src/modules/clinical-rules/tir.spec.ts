import { evaluateTir, TirInput, TirTargets } from '@lifecode/shared';

const STANDARD: TirTargets = { tirTargetFraction: 0.7 };
const OLDER_HIGH_RISK: TirTargets = { tirTargetFraction: 0.5 };

/** Constrói leituras com `inRangeFrac` no alvo 70–180; `n` leituras válidas de `expected` esperadas. */
function readings(inRangeFrac: number, n: number, expected: number): TirInput {
  const inRange = Math.round(n * inRangeFrac);
  const arr: number[] = [];
  for (let i = 0; i < inRange; i++) arr.push(120); // no alvo
  for (let i = inRange; i < n; i++) arr.push(300); // fora (TAR)
  return { validReadingsMgDl: arr, expectedReadingsCount: expected };
}

describe('TIR — métrica longitudinal individual (14d, >=70% dados válidos)', () => {
  it('perfil padrão + TIR 62% + 85% dados válidos → belowTarget', () => {
    const r = evaluateTir(readings(0.62, 85, 100), STANDARD);
    expect(r.insufficientData).toBe(false);
    expect(r.belowTarget).toBe(true);
  });

  it('perfil alto risco + TIR 45% + 90% dados → belowTarget', () => {
    const r = evaluateTir(readings(0.45, 90, 100), OLDER_HIGH_RISK);
    expect(r.insufficientData).toBe(false);
    expect(r.belowTarget).toBe(true);
  });

  it('perfil padrão + TIR 75% → não belowTarget', () => {
    const r = evaluateTir(readings(0.75, 85, 100), STANDARD);
    expect(r.belowTarget).toBe(false);
  });

  it('perfil alto risco + TIR 55% → não belowTarget', () => {
    const r = evaluateTir(readings(0.55, 90, 100), OLDER_HIGH_RISK);
    expect(r.belowTarget).toBe(false);
  });

  it('apenas 60% de dados válidos → insuficiência de dados, sem care gap', () => {
    const r = evaluateTir(readings(0.3, 60, 100), STANDARD);
    expect(r.insufficientData).toBe(true);
    expect(r.belowTarget).toBe(false);
  });

  it('uma leitura isolada (160) não produz TIR/care gap (dados insuficientes)', () => {
    const r = evaluateTir({ validReadingsMgDl: [160], expectedReadingsCount: 100 }, STANDARD);
    expect(r.insufficientData).toBe(true);
    expect(r.belowTarget).toBe(false);
  });
});
