/**
 * Contexto de risco glicêmico — SNAPSHOT imutável e versionado, capturado no momento
 * da decisão. Nunca recalcular retroativamente o contexto de um alerta antigo com dados atuais.
 *
 * Ver docs/adr/ADR-0002-motor-regras-clinicas.md.
 */

/** Código do regime de metas glicêmicas (o "perfil de risco"). */
export enum RiskProfileCode {
  GLYCEMIC_TARGET_STANDARD = 'GLYCEMIC_TARGET_STANDARD',
  GLYCEMIC_TARGET_OLDER_HIGH_RISK = 'GLYCEMIC_TARGET_OLDER_HIGH_RISK',
  GLYCEMIC_TARGET_INDIVIDUALIZED = 'GLYCEMIC_TARGET_INDIVIDUALIZED',
  /** Gestação — EXCLUÍDA da primeira versão das regras; encaminhada a regras próprias. */
  GLYCEMIC_TARGET_PREGNANCY = 'GLYCEMIC_TARGET_PREGNANCY',
}

/**
 * Modificadores clínicos independentes do paciente no instante da avaliação.
 *
 * Distinguir SEMPRE três estados distintos: `false` (negado), `undefined` (desconhecido/
 * não coletado). NÃO inventar dados ausentes.
 */
export interface GlycemicRiskContextSnapshot {
  diabetesType?: 'TYPE_1' | 'TYPE_2' | 'OTHER' | 'UNKNOWN';
  usesInsulin?: boolean;
  usesSulfonylurea?: boolean;
  usesSGLT2?: boolean;
  usesInsulinPump?: boolean;
  usesAutomatedInsulinDelivery?: boolean;
  priorLevel3Hypoglycemia?: boolean;
  hypoglycemiaUnawareness?: boolean;
  frailty?: boolean;
  cognitiveImpairment?: boolean;
  ckdStage?: string;
  heartFailure?: boolean;
  pregnancy?: boolean;
  individualizedRangeLowerMgDl?: number;
  individualizedRangeUpperMgDl?: number;
  individualizedTirTargetPercent?: number;
  /** ISO 8601. */
  capturedAt: string;
}

/** Snapshot completo persistido junto ao alerta/incidente (imutável). */
export interface RiskContextRef {
  riskProfileCode: RiskProfileCode;
  riskProfileVersion: string;
  /** ISO 8601 — quando o snapshot foi capturado. */
  riskProfileCapturedAt: string;
  riskContextSnapshot: GlycemicRiskContextSnapshot;
}
