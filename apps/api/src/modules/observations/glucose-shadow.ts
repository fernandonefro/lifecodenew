import {
  classifyGlycemiaReading,
  GlycemiaReadingInput,
  CANDIDATE_RULES,
  evaluateRuleUnderGovernance,
  RuleEvaluationOutcome,
} from '@lifecode/shared';

/**
 * Avaliação SHADOW (observacional) das regras candidatas de glicemia.
 *
 * PURA e SEM efeito colateral: classifica a leitura, encontra as regras candidatas do subtipo
 * e passa cada uma pelo gate de governança. Como as candidatas são DRAFT/DISABLED, TODO outcome
 * tem `emit === false` (garantido pelo gate). Não persiste, não notifica, não cria alerta.
 *
 * O resultado NÃO contém valores glicêmicos nem identificadores — apenas ruleCode/subtipo/decisão.
 */
export function evaluateGlucoseInShadow(input: GlycemiaReadingInput): RuleEvaluationOutcome[] {
  const subtype = classifyGlycemiaReading(input);
  if (!subtype) return [];
  const rules = CANDIDATE_RULES.filter((r) => r.alertSubtype === subtype);
  return rules.map((r) => evaluateRuleUnderGovernance(r, true));
}
