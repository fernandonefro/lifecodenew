import { AlertDomain } from '../alert-domain.enum';
import { AlertSubtype } from '../alert-subtype.enum';
import {
  DeploymentStatus,
  GovernanceStatus,
  RegulatoryAssessmentStatus,
} from '../governance.enum';
import { RiskProfileCode } from '../risk-context';
import { VersionedClinicalRule } from '../rule-definition';
import { CLINICAL_REFERENCES } from '../references';

/**
 * REGRAS CANDIDATAS — todas `DEPLOYMENT: DISABLED` + `GOVERNANCE: DRAFT`.
 *
 * NÃO emitem alerta/tarefa/mensagem/escalonamento. Parâmetros numéricos aqui são
 * candidatos de PRODUTO (DRAFT), não exigências diretas de diretriz. `priority`, SLAs,
 * aprovadores (UUID) e templates permanecem indefinidos — pendentes do Comitê/regulatório.
 */
const DRAFT_COMMON = {
  deploymentStatus: DeploymentStatus.DISABLED,
  governanceStatus: GovernanceStatus.DRAFT,
  regulatoryAssessmentStatus: RegulatoryAssessmentStatus.PENDING,
} as const;

export const CANDIDATE_RULES: VersionedClinicalRule[] = [
  // ---------- Hipoglicemia: níveis 2 e 3 (sucessoras do legado CLIN-HYPO-SEVERE) ----------
  {
    ruleCode: 'CLIN-HYPO-LEVEL2',
    ruleVersion: '1.0.0-draft',
    alertDomain: AlertDomain.CLINICAL,
    alertSubtype: AlertSubtype.HYPOGLYCEMIA_LEVEL_2,
    eligiblePopulation: 'Pacientes com monitoramento de glicemia (exceto gestação nesta versão).',
    entryCondition: 'value < 54 mg/dL',
    symptomsAndModifiers: ['Precedência: LEVEL3 > LEVEL2 > LEVEL1'],
    references: [CLINICAL_REFERENCES.ADA_2026_S6],
    ...DRAFT_COMMON,
  },
  {
    ruleCode: 'CLIN-HYPO-LEVEL3',
    ruleVersion: '1.0.0-draft',
    alertDomain: AlertDomain.CLINICAL,
    alertSubtype: AlertSubtype.HYPOGLYCEMIA_LEVEL_3,
    eligiblePopulation: 'Pacientes com monitoramento de glicemia (exceto gestação nesta versão).',
    entryCondition:
      'Alteração mental/física com necessidade de ajuda de terceiros, INDEPENDENTE do valor de glicose',
    symptomsAndModifiers: [
      'severeHypoNeedsAssistance',
      'Se LEVEL3, não emitir LEVEL1/LEVEL2 como incidentes independentes',
    ],
    references: [CLINICAL_REFERENCES.ADA_2026_S6],
    ...DRAFT_COMMON,
  },

  // ---------- Suspeita de cetoacidose (sucessora do legado CLIN-HYPER-KETONE) ----------
  {
    ruleCode: 'CLIN-DKA-SUSPECTED',
    ruleVersion: '1.0.0-draft',
    alertDomain: AlertDomain.CLINICAL,
    alertSubtype: AlertSubtype.SUSPECTED_DKA,
    eligiblePopulation: 'Pacientes com DM (atenção a uso de SGLT2 — DKA euglicêmica possível).',
    entryCondition:
      'NÃO exige >300 mg/dL. Candidato (DRAFT): beta-hidroxibutirato >=3 mmol/L; OU cetona urinária >=2+; ' +
      'OU hiperglicemia com vômitos persistentes / dor abdominal / dispneia / sonolência / confusão',
    symptomsAndModifiers: [
      'Precedência: SUSPECTED_DKA > HYPERGLYCEMIA_MARKED > HYPERGLYCEMIA_SUSTAINED',
      'É SUSPEITA — o software não mede acidose; nunca afirmar diagnóstico de DKA',
    ],
    references: [CLINICAL_REFERENCES.HYPERGLYCEMIC_CRISES_2024, CLINICAL_REFERENCES.SBD],
    ...DRAFT_COMMON,
  },

  // ---------- Hiperglicemia marcada v2 (sucessora do legado >250 isolado) ----------
  {
    ruleCode: 'CLIN-HYPER-MARKED',
    ruleVersion: '2.0.0-draft',
    alertDomain: AlertDomain.CLINICAL,
    alertSubtype: AlertSubtype.HYPERGLYCEMIA_MARKED,
    eligiblePopulation: 'Pacientes com monitoramento de glicemia (exceto gestação nesta versão).',
    entryCondition:
      'value > 250 mg/dL sustentada por 60 min (DRAFT) OU confirmada em duas medições separadas. ' +
      'Uma leitura isolada > 250 NÃO ativa esta regra.',
    exitCondition: 'value <= 250 mg/dL mantida por 30 min (DRAFT)',
    temporalWindow: { sustainedMinutes: 60 },
    references: [CLINICAL_REFERENCES.ADA_2026_S6, CLINICAL_REFERENCES.SBD],
    ...DRAFT_COMMON,
  },

  // ---------- Hiperglicemia sustentada ----------
  {
    ruleCode: 'CLIN-HYPER-SUSTAINED',
    ruleVersion: '1.0.0-draft',
    alertDomain: AlertDomain.CLINICAL,
    alertSubtype: AlertSubtype.HYPERGLYCEMIA_SUSTAINED,
    eligiblePopulation: 'Pacientes com monitoramento de glicemia (exceto gestação nesta versão).',
    entryCondition: 'value > 180 e <= 250 mg/dL por pelo menos 180 min (DRAFT), com dados válidos',
    exitCondition: 'value <= 180 mg/dL por 60 min (DRAFT)',
    temporalWindow: { sustainedMinutes: 180 },
    symptomsAndModifiers: [
      'Gaps relevantes de dados pausam/invalidam a continuidade — nunca inferir glicemia em período sem dados',
    ],
    references: [CLINICAL_REFERENCES.TIR_CONSENSUS],
    ...DRAFT_COMMON,
  },

  // ---------- DEVICE: CGM data gap (duas etapas) ----------
  {
    ruleCode: 'DEVICE-CGM-DATA-GAP',
    ruleVersion: '1.0.0-draft',
    alertDomain: AlertDomain.DEVICE,
    alertSubtype: AlertSubtype.CGM_DATA_GAP,
    eligiblePopulation: 'Pacientes com CGM ativo e integração com configuração confiável.',
    entryCondition:
      'Ausência de leitura além de initialGapThresholdMinutes (por dispositivo). Sem config confiável, permanece DISABLED. ' +
      'Excluir: aquecimento, troca programada, sensor encerrado, compartilhamento pausado, manutenção, ' +
      'indisponibilidade global da API, backlog de ingestão, leituras duplicadas/fora de ordem.',
    exitCondition: 'duas leituras válidas consecutivas OU fluxo restabelecido pelo período configurado',
    symptomsAndModifiers: ['Falha global → incidente técnico agregado, NÃO um alerta por paciente'],
    ...DRAFT_COMMON,
  },
  {
    ruleCode: 'DEVICE-CGM-DATA-GAP-PERSISTENT',
    ruleVersion: '1.0.0-draft',
    alertDomain: AlertDomain.DEVICE,
    alertSubtype: AlertSubtype.CGM_DATA_GAP_PERSISTENT,
    eligiblePopulation: 'Pacientes com CGM ativo e integração com configuração confiável.',
    entryCondition:
      'Ausência persistente além de persistentGapThresholdMinutes. Candidatos (DRAFT): 60 min alto risco / 120 min demais.',
    exitCondition: 'duas leituras válidas consecutivas OU fluxo restabelecido pelo período configurado',
    ...DRAFT_COMMON,
  },

  // ---------- CARE_MANAGEMENT: TIR / TBR / TAR ----------
  {
    ruleCode: 'CAREMGT-TIR-BELOW-TARGET',
    ruleVersion: '1.0.0-draft',
    alertDomain: AlertDomain.CARE_MANAGEMENT,
    alertSubtype: AlertSubtype.CARE_GAP,
    eligiblePopulation: 'Pacientes com CGM (exceto gestação). Meta individual registrada; padrão só como fallback.',
    entryCondition:
      'Janela móvel de 14 dias, >=70% de dados válidos, TIR 70–180 abaixo da meta individual. ' +
      'Fonte-da-verdade = modelo CareGap (referenciar via careGapId; não duplicar). Avaliar diariamente; notificar no máx. semanalmente. ' +
      'Se <70% de dados válidos: NÃO abrir care gap de TIR (tratar insuficiência de dados separadamente).',
    temporalWindow: { windowDays: 14, minValidDataFraction: 0.7 },
    symptomsAndModifiers: [
      'TIR baixo sozinho não determina ajuste; analisar TBR, TAR, variabilidade e padrão temporal',
      'Sem mensagem automática ao paciente antes de revisão profissional',
      'Meta padrão (DRAFT): TIR>70%; idoso/alto risco: TIR>50%',
    ],
    riskProfileCode: RiskProfileCode.GLYCEMIC_TARGET_STANDARD,
    references: [CLINICAL_REFERENCES.TIR_CONSENSUS, CLINICAL_REFERENCES.ADA_2026_S6],
    ...DRAFT_COMMON,
  },
  {
    ruleCode: 'CAREMGT-TBR-ABOVE-TARGET',
    ruleVersion: '1.0.0-draft',
    alertDomain: AlertDomain.CARE_MANAGEMENT,
    alertSubtype: AlertSubtype.CARE_GAP,
    eligiblePopulation: 'Pacientes com CGM (exceto gestação).',
    entryCondition:
      'Janela 14d, >=70% dados válidos. TBR acima da meta. Candidatos (DRAFT): adulto TBR<70 >4% ou TBR<54 >1%; idoso TBR<70 >1%.',
    temporalWindow: { windowDays: 14, minValidDataFraction: 0.7 },
    references: [CLINICAL_REFERENCES.TIR_CONSENSUS],
    ...DRAFT_COMMON,
  },
  {
    ruleCode: 'CAREMGT-TAR-ABOVE-TARGET',
    ruleVersion: '1.0.0-draft',
    alertDomain: AlertDomain.CARE_MANAGEMENT,
    alertSubtype: AlertSubtype.CARE_GAP,
    eligiblePopulation: 'Pacientes com CGM (exceto gestação).',
    entryCondition:
      'Janela 14d, >=70% dados válidos. TAR acima da meta. Candidatos (DRAFT): adulto TAR>250 >5%; idoso TAR>250 >10%.',
    temporalWindow: { windowDays: 14, minValidDataFraction: 0.7 },
    references: [CLINICAL_REFERENCES.TIR_CONSENSUS],
    ...DRAFT_COMMON,
  },
];
