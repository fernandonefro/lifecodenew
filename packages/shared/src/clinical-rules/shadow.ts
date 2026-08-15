import { DeploymentStatus } from './governance.enum';
import { VersionedClinicalRule } from './rule-definition';
import { canEmitInProduction } from './governance-gate';

/**
 * Resultado da avaliação de uma regra sob governança. Uma regra só produz efeito
 * (`emit === true`) quando o gate autoriza. Em SHADOW, produz apenas um registro
 * desidentificado/auditável, SEM efeito no paciente/fila.
 *
 * NUNCA inclui dados clínicos sensíveis (valores, identificadores diretos).
 */
export interface RuleEvaluationOutcome {
  ruleCode: string;
  ruleVersion: string;
  matched: boolean;
  /** true somente quando o gate autoriza emissão em produção. */
  emit: boolean;
  /** true quando a avaliação é apenas registrada para validação (deploymentStatus SHADOW). */
  shadowRecorded: boolean;
  gateReason: string;
}

/**
 * Decide o desfecho de uma regra dado se sua condição casou (`matched`).
 * Função PURA — não persiste, não notifica. O caller decide o que fazer com o outcome,
 * mas NUNCA deve emitir quando `emit === false`.
 *
 * Garante os invariantes: regras DRAFT/DISABLED/SHADOW → `emit === false`.
 */
export function evaluateRuleUnderGovernance(
  rule: VersionedClinicalRule,
  matched: boolean,
): RuleEvaluationOutcome {
  const gate = canEmitInProduction(rule);
  const emit = matched && gate.canEmit;
  const shadowRecorded =
    matched && !gate.canEmit && rule.deploymentStatus === DeploymentStatus.SHADOW;
  return {
    ruleCode: rule.ruleCode,
    ruleVersion: rule.ruleVersion,
    matched,
    emit,
    shadowRecorded,
    gateReason: gate.reason,
  };
}
