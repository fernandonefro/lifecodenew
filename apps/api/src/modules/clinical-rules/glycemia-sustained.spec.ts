import {
  AlertSubtype,
  TimedReading,
  SustainedHyperParams,
  evaluateSustainedHyperglycemia,
  longestSustainedMinutes,
  HYPER_SUSTAINED_LOWER_MGDL,
  HYPER_MARKED_LOWER_MGDL,
} from '@lifecode/shared';

const PARAMS: SustainedHyperParams = {
  markedSustainMinutes: 60,
  sustainedMinutes: 180,
  maxGapMinutes: 15,
};

/** Série contínua de `value` mg/dL, de t=0 até `durationMin` (inclusive), passo `step`. */
function series(value: number, durationMin: number, step = 15): TimedReading[] {
  const out: TimedReading[] = [];
  for (let t = 0; t < durationMin; t += step) out.push({ tMinutes: t, glucoseMgDl: value, valid: true });
  out.push({ tMinutes: durationMin, glucoseMgDl: value, valid: true });
  return out;
}

describe('Hiperglicemia marcada (v2) e sustentada — por duração, no backend', () => {
  it('260 por 60 minutos → MARKED (positivo candidato)', () => {
    expect(evaluateSustainedHyperglycemia(series(260, 60), PARAMS)).toBe(
      AlertSubtype.HYPERGLYCEMIA_MARKED,
    );
  });

  it('280 isolado → negativo (não ativa marcada v2)', () => {
    const isolated: TimedReading[] = [{ tMinutes: 0, glucoseMgDl: 280, valid: true }];
    expect(evaluateSustainedHyperglycemia(isolated, PARAMS)).toBeNull();
  });

  it('240 por 180 minutos → SUSTAINED', () => {
    expect(evaluateSustainedHyperglycemia(series(240, 180), PARAMS)).toBe(
      AlertSubtype.HYPERGLYCEMIA_SUSTAINED,
    );
  });

  it('200 por 181 minutos com dados válidos → SUSTAINED (positivo)', () => {
    expect(evaluateSustainedHyperglycemia(series(200, 181), PARAMS)).toBe(
      AlertSubtype.HYPERGLYCEMIA_SUSTAINED,
    );
  });

  it('200 por 179 minutos → negativo', () => {
    expect(evaluateSustainedHyperglycemia(series(200, 179), PARAMS)).toBeNull();
  });

  it('251 não pertence à faixa sustentada (>180 e <=250)', () => {
    const dur = longestSustainedMinutes(
      series(251, 200),
      (g) => g > HYPER_SUSTAINED_LOWER_MGDL && g <= HYPER_MARKED_LOWER_MGDL,
      PARAMS.maxGapMinutes,
    );
    expect(dur).toBe(0);
  });

  it('gap relevante interrompe/pausa a duração', () => {
    const withGap: TimedReading[] = [
      ...series(200, 60),
      { tMinutes: 200, glucoseMgDl: 200, valid: true }, // salto de 140 min > maxGap
    ];
    expect(evaluateSustainedHyperglycemia(withGap, PARAMS)).toBeNull();
  });

  it('leitura inválida no meio quebra a continuidade', () => {
    const s = series(240, 180);
    // invalida um trecho central criando gap de dados
    const broken = s.map((r) =>
      r.tMinutes > 30 && r.tMinutes < 170 ? { ...r, valid: false } : r,
    );
    expect(evaluateSustainedHyperglycemia(broken, PARAMS)).toBeNull();
  });
});
