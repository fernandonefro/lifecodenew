import { evaluateGlucoseInShadow } from './glucose-shadow';
import { AlertSubtype } from '@lifecode/shared';

describe('SHADOW — avaliação candidata de glicemia (observacional, sem efeito)', () => {
  it('leitura normal (120) → nenhuma regra candidata casa', () => {
    expect(evaluateGlucoseInShadow({ glucoseMgDl: 120, sensorValid: true })).toEqual([]);
  });

  it('42 mg/dL → casa nível 2, mas NÃO emite (candidata DRAFT)', () => {
    const outcomes = evaluateGlucoseInShadow({ glucoseMgDl: 42, sensorValid: true });
    expect(outcomes.length).toBeGreaterThan(0);
    expect(outcomes.some((o) => o.ruleCode === 'CLIN-HYPO-LEVEL2')).toBe(true);
    for (const o of outcomes) {
      expect(o.matched).toBe(true);
      expect(o.emit).toBe(false); // invariante: candidatas nunca emitem
    }
  });

  it('320 mg/dL + vômitos → roteia p/ suspeita de DKA, sem emitir', () => {
    const outcomes = evaluateGlucoseInShadow({
      glucoseMgDl: 320,
      sensorValid: true,
      persistentVomiting: true,
    });
    expect(outcomes.some((o) => o.ruleCode === 'CLIN-DKA-SUSPECTED')).toBe(true);
    expect(outcomes.every((o) => o.emit === false)).toBe(true);
  });

  it('invariante global: nenhum outcome jamais emite', () => {
    const samples = [30, 53, 62, 120, 200, 260, 400];
    for (const g of samples) {
      for (const o of evaluateGlucoseInShadow({ glucoseMgDl: g, sensorValid: true })) {
        expect(o.emit).toBe(false);
      }
    }
    // sanity: subtipos conhecidos existem no enum
    expect(Object.values(AlertSubtype)).toContain(AlertSubtype.SUSPECTED_DKA);
  });
});
