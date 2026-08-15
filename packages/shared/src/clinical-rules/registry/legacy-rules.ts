import { AlertDomain } from '../alert-domain.enum';
import { AlertSubtype } from '../alert-subtype.enum';
import {
  DeploymentStatus,
  GovernanceStatus,
  RegulatoryAssessmentStatus,
} from '../governance.enum';
import { VersionedClinicalRule } from '../rule-definition';

/**
 * REGRAS LEGADAS — comportamento HOJE ativo em produção, documentado a partir de
 * `apps/api/src/modules/observations/glucose.service.ts::evaluateGlucoseAlertRules`.
 *
 * NÃO representam parâmetros clinicamente validados por esta governança. Ficam como
 * `deploymentStatus: ACTIVE` + `governanceStatus: LEGACY_UNREVIEWED` — a ÚNICA exceção
 * de emissão permitida sem RELEASE_APPROVED, restrita a esta allowlist (ver governance-gate).
 *
 * Estes objetos são DOCUMENTAÇÃO/registro; a emissão continua sendo feita pelo motor legado
 * inalterado. Não renomear códigos nem reescrever histórico.
 */
export const LEGACY_RULES: VersionedClinicalRule[] = [
  {
    ruleCode: 'CLIN-HYPO-SEVERE',
    ruleVersion: '1.0.0',
    alertDomain: AlertDomain.CLINICAL,
    // Semanticamente impreciso: a regra legada dispara em <54 mg/dL OU confusão — mistura
    // nível 2 e nível 3. Mantido para não reescrever histórico; sucessoras são DRAFT.
    alertSubtype: AlertSubtype.HYPOGLYCEMIA_LEVEL_2,
    legacySemanticAlias: 'SEVERE_HYPO (impreciso: cobre nível 2 e nível 3)',
    deprecatedByRuleCode: 'CLIN-HYPO-LEVEL2',
    deprecatedByRuleVersion: '1.0.0-draft',
    eligiblePopulation: 'Pacientes com ingestão de glicemia (comportamento legado).',
    entryCondition: 'value < 54 mg/dL OU confusionOrAlteredConsciousness (motor legado)',
    priority: 'P0',
    deploymentStatus: DeploymentStatus.ACTIVE,
    governanceStatus: GovernanceStatus.LEGACY_UNREVIEWED,
    regulatoryAssessmentStatus: RegulatoryAssessmentStatus.PENDING,
    goldenPositiveCaseIds: ['GOLDEN-01'],
  },
  {
    ruleCode: 'CLIN-HYPO-LEVEL1',
    ruleVersion: '1.0.0',
    alertDomain: AlertDomain.CLINICAL,
    alertSubtype: AlertSubtype.HYPOGLYCEMIA_LEVEL_1,
    eligiblePopulation: 'Pacientes com ingestão de glicemia (comportamento legado).',
    entryCondition: 'value >= 54 e value < 70 mg/dL (motor legado)',
    priority: 'P1',
    deploymentStatus: DeploymentStatus.ACTIVE,
    governanceStatus: GovernanceStatus.LEGACY_UNREVIEWED,
    regulatoryAssessmentStatus: RegulatoryAssessmentStatus.PENDING,
    goldenPositiveCaseIds: ['GOLDEN-02'],
  },
  {
    ruleCode: 'CLIN-HYPER-KETONE',
    ruleVersion: '1.0.0',
    alertDomain: AlertDomain.CLINICAL,
    // Legado chamava de "risco CAD"; a taxonomia nova usa SUSPECTED_DKA (nunca "diagnóstico").
    alertSubtype: AlertSubtype.SUSPECTED_DKA,
    legacySemanticAlias: 'DKA-RISK (legado exige >300 mg/dL — impreciso p/ SGLT2)',
    deprecatedByRuleCode: 'CLIN-DKA-SUSPECTED',
    deprecatedByRuleVersion: '1.0.0-draft',
    eligiblePopulation: 'Pacientes com ingestão de glicemia (comportamento legado).',
    entryCondition:
      'value > 300 mg/dL com vomitingOrKetoneSigns, OU confusionOrAlteredConsciousness (motor legado)',
    priority: 'P0',
    deploymentStatus: DeploymentStatus.ACTIVE,
    governanceStatus: GovernanceStatus.LEGACY_UNREVIEWED,
    regulatoryAssessmentStatus: RegulatoryAssessmentStatus.PENDING,
    goldenPositiveCaseIds: ['GOLDEN-03'],
  },
  {
    ruleCode: 'CLIN-HYPER-MARKED',
    ruleVersion: '1.0.0',
    alertDomain: AlertDomain.CLINICAL,
    alertSubtype: AlertSubtype.HYPERGLYCEMIA_MARKED,
    legacySemanticAlias: '>250 isolado (sem duração/contexto — impreciso)',
    deprecatedByRuleCode: 'CLIN-HYPER-MARKED',
    deprecatedByRuleVersion: '2.0.0-draft',
    eligiblePopulation: 'Pacientes com ingestão de glicemia (comportamento legado).',
    entryCondition: 'value > 250 mg/dL, leitura isolada (motor legado)',
    priority: 'P1',
    deploymentStatus: DeploymentStatus.ACTIVE,
    governanceStatus: GovernanceStatus.LEGACY_UNREVIEWED,
    regulatoryAssessmentStatus: RegulatoryAssessmentStatus.PENDING,
    // Sem golden dedicado hoje — registrado como risco legado no ADR.
  },
];

/**
 * Allowlist IMUTÁVEL dos códigos legados autorizados à exceção de emissão.
 * NENHUMA regra futura pode entrar aqui.
 */
export const LEGACY_RULE_ALLOWLIST: ReadonlyArray<string> = Object.freeze([
  'CLIN-HYPO-SEVERE@1.0.0',
  'CLIN-HYPO-LEVEL1@1.0.0',
  'CLIN-HYPER-KETONE@1.0.0',
  'CLIN-HYPER-MARKED@1.0.0',
]);
