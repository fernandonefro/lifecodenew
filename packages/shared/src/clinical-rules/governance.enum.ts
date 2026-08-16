/**
 * Estados de governança e implantação de regras clínicas/operacionais.
 *
 * `deploymentStatus` e `governanceStatus` são DIMENSÕES INDEPENDENTES
 * (ver docs/adr/ADR-0002-motor-regras-clinicas.md).
 */

/** Estado de implantação técnica — se/como a regra é avaliada. */
export enum DeploymentStatus {
  /** Não avaliada. */
  DISABLED = 'DISABLED',
  /** Avaliada e registrada para observação/validação, SEM efeito no paciente/fila. */
  SHADOW = 'SHADOW',
  /** Em efeito pleno. */
  ACTIVE = 'ACTIVE',
}

/** Estado de governança clínica/regulatória — maturidade de aprovação. */
export enum GovernanceStatus {
  /** Proposta, em elaboração. */
  DRAFT = 'DRAFT',
  /** Implantada historicamente, ainda não revisada por esta governança (exceção legada). */
  LEGACY_UNREVIEWED = 'LEGACY_UNREVIEWED',
  /** Aprovada pelo Comitê Clínico. */
  CLINICALLY_APPROVED = 'CLINICALLY_APPROVED',
  /** Avaliada pelo responsável regulatório. */
  REGULATORY_ASSESSED = 'REGULATORY_ASSESSED',
  /** Validada tecnicamente (testes, verificação). */
  TECHNICALLY_VALIDATED = 'TECHNICALLY_VALIDATED',
  /** Liberada para produção (todas as aprovações concluídas). */
  RELEASE_APPROVED = 'RELEASE_APPROVED',
  /** Aposentada. */
  RETIRED = 'RETIRED',
}

/**
 * Status do enquadramento regulatório sanitário (Anvisa) / classe IEC 62304.
 * NUNCA presumir a classe automaticamente — depende de parecer do responsável regulatório
 * e do uso pretendido do produto.
 */
export enum RegulatoryAssessmentStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  ASSESSED = 'ASSESSED',
}
