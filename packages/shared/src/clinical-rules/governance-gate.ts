import { DeploymentStatus, GovernanceStatus } from './governance.enum';
import { VersionedClinicalRule } from './rule-definition';
import { isLegacyAllowlisted } from './registry';

/** Resultado da checagem de emissão, com motivo auditável. */
export interface EmissionDecision {
  canEmit: boolean;
  reason:
    | 'RELEASE_APPROVED_ACTIVE'
    | 'LEGACY_ALLOWLISTED_ACTIVE'
    | 'NOT_ACTIVE'
    | 'NOT_RELEASE_APPROVED'
    | 'LEGACY_EXCEPTION_NOT_ALLOWLISTED';
}

/**
 * ÚNICO ponto de decisão sobre se uma regra pode EMITIR em produção
 * (alerta ativo, tarefa, mensagem, notificação, escalonamento, dueDate operacional).
 *
 * Regra geral: `deploymentStatus === ACTIVE` E `governanceStatus === RELEASE_APPROVED`.
 *
 * Exceção legada (temporária, auditável): regras `ACTIVE` + `LEGACY_UNREVIEWED` que estão
 * na allowlist imutável. NENHUMA regra futura pode usar essa exceção (a allowlist é fixa).
 *
 * Função PURA e determinística.
 */
export function canEmitInProduction(rule: VersionedClinicalRule): EmissionDecision {
  const isActive = rule.deploymentStatus === DeploymentStatus.ACTIVE;

  // Exceção legada.
  if (rule.governanceStatus === GovernanceStatus.LEGACY_UNREVIEWED) {
    if (!isLegacyAllowlisted(rule)) {
      return { canEmit: false, reason: 'LEGACY_EXCEPTION_NOT_ALLOWLISTED' };
    }
    if (!isActive) return { canEmit: false, reason: 'NOT_ACTIVE' };
    return { canEmit: true, reason: 'LEGACY_ALLOWLISTED_ACTIVE' };
  }

  // Caminho normal.
  if (!isActive) return { canEmit: false, reason: 'NOT_ACTIVE' };
  if (rule.governanceStatus !== GovernanceStatus.RELEASE_APPROVED) {
    return { canEmit: false, reason: 'NOT_RELEASE_APPROVED' };
  }
  return { canEmit: true, reason: 'RELEASE_APPROVED_ACTIVE' };
}

/** Regras `DRAFT`/`DISABLED`/`SHADOW` não produzem NENHUM efeito colateral. */
export function isInert(rule: VersionedClinicalRule): boolean {
  return !canEmitInProduction(rule).canEmit;
}
