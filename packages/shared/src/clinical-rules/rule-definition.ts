import { AlertDomain } from './alert-domain.enum';
import { AlertSubtype } from './alert-subtype.enum';
import { DeploymentStatus, GovernanceStatus, RegulatoryAssessmentStatus } from './governance.enum';
import { RuleApproval } from './rule-approval';
import { RiskProfileCode } from './risk-context';

/** Comparadores suportados por uma condição de limiar. */
export type ThresholdComparison =
  | 'LESS_THAN'
  | 'LESS_OR_EQUAL'
  | 'GREATER_THAN'
  | 'GREATER_OR_EQUAL'
  | 'BETWEEN';

export interface GlucoseThreshold {
  comparison: ThresholdComparison;
  valueMgDl: number;
  upperValueMgDl?: number;
}

/** Janela temporal — SEMPRE derivada no backend a partir de timestamps/histórico. */
export interface TemporalWindow {
  /** Minutos de sustentação exigidos para ENTRADA (ex.: 60, 180). Parâmetro de produto. */
  sustainedMinutes?: number;
  /** Janela longitudinal em dias (ex.: 14 para TIR). */
  windowDays?: number;
  /** Fração mínima de dados válidos na janela (0..1), ex.: 0.70. */
  minValidDataFraction?: number;
}

export interface RepetitionPolicy {
  /** Frequência de avaliação (ex.: 'PER_READING', 'DAILY'). */
  evaluateEvery: 'PER_READING' | 'HOURLY' | 'DAILY';
  /** Intervalo mínimo entre notificações (ex.: 'WEEKLY'). */
  notifyAtMost?: 'HOURLY' | 'DAILY' | 'WEEKLY';
  /** Período de separação (min) antes de reabrir após resolução. */
  reopenSeparationMinutes?: number;
}

export interface RuleReference {
  label: string;
  url: string;
}

/**
 * Modelo declarativo e VERSIONADO de uma regra clínica/operacional.
 * É dado puro — a avaliação é feita por avaliadores puros separados.
 */
export interface VersionedClinicalRule {
  ruleCode: string;
  ruleVersion: string; // SemVer
  alertDomain: AlertDomain;
  alertSubtype: AlertSubtype;

  eligiblePopulation: string;
  entryCondition: string;
  exitCondition?: string;
  temporalWindow?: TemporalWindow;
  repetitionPolicy?: RepetitionPolicy;
  symptomsAndModifiers?: string[];

  /** Prioridade OPERACIONAL (P0–P3). Pode ser indefinida enquanto DRAFT (pendente do Comitê). */
  priority?: 'P0' | 'P1' | 'P2' | 'P3';
  acknowledgementSla?: string;
  interventionSla?: string;
  escalationPolicy?: string;

  patientMessageTemplateId?: string;
  teamAction?: string;
  clinicalRationale?: string;
  references?: RuleReference[];

  approvals?: RuleApproval[];
  riskProfileCode?: RiskProfileCode;
  riskProfileVersion?: string;

  goldenPositiveCaseIds?: string[];
  goldenNegativeCaseIds?: string[];

  deploymentStatus: DeploymentStatus;
  governanceStatus: GovernanceStatus;
  regulatoryAssessmentStatus: RegulatoryAssessmentStatus;

  /** ISO 8601. */
  effectiveFrom?: string;
  effectiveTo?: string;

  // Sucessão / preservação do legado.
  deprecatedByRuleCode?: string;
  deprecatedByRuleVersion?: string;
  /** Marca uma regra legada como semanticamente imprecisa, sem reescrever seu histórico. */
  legacySemanticAlias?: string;
}
