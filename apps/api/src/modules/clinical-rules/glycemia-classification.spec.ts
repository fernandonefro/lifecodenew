import {
  AlertSubtype,
  classifyGlycemiaReading,
  classifyHypoglycemia,
  assessDkaSuspicion,
  GlycemiaReadingInput,
} from '@lifecode/shared';

const base: GlycemiaReadingInput = { glucoseMgDl: 100, sensorValid: true };

describe('Classificação de hipoglicemia (níveis 1/2/3 + precedência)', () => {
  it('54 e 69 → LEVEL1', () => {
    expect(classifyHypoglycemia({ ...base, glucoseMgDl: 54 })).toBe(AlertSubtype.HYPOGLYCEMIA_LEVEL_1);
    expect(classifyHypoglycemia({ ...base, glucoseMgDl: 69 })).toBe(AlertSubtype.HYPOGLYCEMIA_LEVEL_1);
  });

  it('53 e 42 → LEVEL2', () => {
    expect(classifyHypoglycemia({ ...base, glucoseMgDl: 53 })).toBe(AlertSubtype.HYPOGLYCEMIA_LEVEL_2);
    expect(classifyHypoglycemia({ ...base, glucoseMgDl: 42 })).toBe(AlertSubtype.HYPOGLYCEMIA_LEVEL_2);
  });

  it('68 + convulsão/necessidade de ajuda → LEVEL3', () => {
    expect(
      classifyHypoglycemia({ ...base, glucoseMgDl: 68, needsThirdPartyAssistance: true }),
    ).toBe(AlertSubtype.HYPOGLYCEMIA_LEVEL_3);
    expect(classifyHypoglycemia({ ...base, glucoseMgDl: 68, seizure: true })).toBe(
      AlertSubtype.HYPOGLYCEMIA_LEVEL_3,
    );
  });

  // Negativos / roteamento / fronteiras
  it('53 não pode ser LEVEL1', () => {
    expect(classifyHypoglycemia({ ...base, glucoseMgDl: 53 })).not.toBe(
      AlertSubtype.HYPOGLYCEMIA_LEVEL_1,
    );
  });
  it('54 não pode ser LEVEL2', () => {
    expect(classifyHypoglycemia({ ...base, glucoseMgDl: 54 })).not.toBe(
      AlertSubtype.HYPOGLYCEMIA_LEVEL_2,
    );
  });
  it('70 não gera hipoglicemia', () => {
    expect(classifyHypoglycemia({ ...base, glucoseMgDl: 70 })).toBeNull();
  });
  it('sensor inválido (sem marcador de nível 3) não gera evento', () => {
    expect(classifyHypoglycemia({ ...base, glucoseMgDl: 40, sensorValid: false })).toBeNull();
  });
  it('LEVEL3 suprime duplicação de LEVEL1/LEVEL2', () => {
    // 68 (seria LEVEL1) + necessidade de ajuda → apenas LEVEL3
    const r = classifyGlycemiaReading({ ...base, glucoseMgDl: 68, needsThirdPartyAssistance: true });
    expect(r).toBe(AlertSubtype.HYPOGLYCEMIA_LEVEL_3);
  });
});

describe('Suspeita de DKA (roteamento; não exige >300; SGLT2)', () => {
  it('DM + SGLT2 + glicose 178 + beta-OHB 3,2 + vômitos → SUSPECTED_DKA', () => {
    const input: GlycemiaReadingInput = {
      glucoseMgDl: 178,
      sensorValid: true,
      betaHydroxybutyrateMmol: 3.2,
      persistentVomiting: true,
    };
    expect(assessDkaSuspicion(input).suspected).toBe(true);
    expect(classifyGlycemiaReading(input)).toBe(AlertSubtype.SUSPECTED_DKA);
  });

  it('glicose 320 + cetona urinária 2+ → SUSPECTED_DKA', () => {
    const input: GlycemiaReadingInput = { glucoseMgDl: 320, sensorValid: true, urineKetonesPlus: 2 };
    expect(classifyGlycemiaReading(input)).toBe(AlertSubtype.SUSPECTED_DKA);
  });

  it('glicose 310 sem cetonas ou sintomas → HYPERGLYCEMIA_MARKED (roteamento)', () => {
    const input: GlycemiaReadingInput = { glucoseMgDl: 310, sensorValid: true };
    expect(assessDkaSuspicion(input).suspected).toBe(false);
    expect(classifyGlycemiaReading(input)).toBe(AlertSubtype.HYPERGLYCEMIA_MARKED);
  });

  it('cetona negativa + sensor inválido → não emitir DKA', () => {
    const input: GlycemiaReadingInput = {
      glucoseMgDl: 320,
      sensorValid: false,
      betaHydroxybutyrateMmol: 0.4,
      urineKetonesPlus: 0,
    };
    expect(assessDkaSuspicion(input).suspected).toBe(false);
    expect(classifyGlycemiaReading(input)).toBeNull();
  });

  it('270 + cetona 2+ → SUSPECTED_DKA (DKA tem precedência sobre marcada)', () => {
    const input: GlycemiaReadingInput = { glucoseMgDl: 270, sensorValid: true, urineKetonesPlus: 2 };
    expect(classifyGlycemiaReading(input)).toBe(AlertSubtype.SUSPECTED_DKA);
  });
});
