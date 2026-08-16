/**
 * Registro de aprovação de regra — auditável e imutável.
 *
 * Uma aprovação NÃO é um UUID solto: vem de um usuário autenticado, tem tipo, decisão,
 * racional e timestamp. Ver docs/adr/ADR-0002-motor-regras-clinicas.md.
 */

export type ApprovalType = 'CLINICAL' | 'REGULATORY' | 'TECHNICAL' | 'RELEASE';
export type ApprovalDecision = 'APPROVED' | 'REJECTED';

export interface RuleApproval {
  approvalType: ApprovalType;
  /** UUID do usuário autenticado que decidiu — preenchido em runtime, NUNCA fictício. */
  approverUserId: string;
  ruleCode: string;
  ruleVersion: string;
  decision: ApprovalDecision;
  rationale: string;
  /** ISO 8601. */
  approvedAt: string;
}
