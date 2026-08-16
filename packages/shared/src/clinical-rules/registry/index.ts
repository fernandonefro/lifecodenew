import { VersionedClinicalRule } from '../rule-definition';
import { LEGACY_RULES, LEGACY_RULE_ALLOWLIST } from './legacy-rules';
import { CANDIDATE_RULES } from './candidate-rules';

export { LEGACY_RULES, LEGACY_RULE_ALLOWLIST } from './legacy-rules';
export { CANDIDATE_RULES } from './candidate-rules';

/** Chave estável de uma regra (ruleCode@ruleVersion). */
export function ruleKey(r: Pick<VersionedClinicalRule, 'ruleCode' | 'ruleVersion'>): string {
  return `${r.ruleCode}@${r.ruleVersion}`;
}

/** Registro completo (legado + candidatas). Fonte única de verdade das definições de regra. */
export const RULE_REGISTRY: ReadonlyArray<VersionedClinicalRule> = Object.freeze([
  ...LEGACY_RULES,
  ...CANDIDATE_RULES,
]);

export function findRule(code: string, version: string): VersionedClinicalRule | undefined {
  return RULE_REGISTRY.find((r) => r.ruleCode === code && r.ruleVersion === version);
}

/** Uma regra está na allowlist legada (exceção de emissão)? */
export function isLegacyAllowlisted(
  r: Pick<VersionedClinicalRule, 'ruleCode' | 'ruleVersion'>,
): boolean {
  return LEGACY_RULE_ALLOWLIST.includes(ruleKey(r));
}
