/**
 * Subtipo do alerta — a especialização dentro de um {@link AlertDomain}.
 *
 * O subtipo carrega o SIGNIFICADO clínico/operacional; a prioridade (P0–P3) carrega
 * apenas a urgência de SLA. Ver docs/adr/ADR-0002-motor-regras-clinicas.md.
 */
export enum AlertSubtype {
  // --- CLINICAL: hipoglicemia (ADA: níveis 1, 2, 3) ---
  /** Nível 1: glicemia >=54 e <70 mg/dL. */
  HYPOGLYCEMIA_LEVEL_1 = 'HYPOGLYCEMIA_LEVEL_1',
  /** Nível 2: glicemia <54 mg/dL. */
  HYPOGLYCEMIA_LEVEL_2 = 'HYPOGLYCEMIA_LEVEL_2',
  /** Nível 3: evento grave com alteração mental/física exigindo ajuda de terceiros, independente do valor. */
  HYPOGLYCEMIA_LEVEL_3 = 'HYPOGLYCEMIA_LEVEL_3',

  // --- CLINICAL: hiperglicemia / cetoacidose ---
  /** Hiperglicemia marcada (parametrizada; ver regra candidata). */
  HYPERGLYCEMIA_MARKED = 'HYPERGLYCEMIA_MARKED',
  /** Hiperglicemia sustentada em faixa intermediária. */
  HYPERGLYCEMIA_SUSTAINED = 'HYPERGLYCEMIA_SUSTAINED',
  /** SUSPEITA de cetoacidose — NUNCA um diagnóstico de DKA (o software não mede acidose). */
  SUSPECTED_DKA = 'SUSPECTED_DKA',

  // --- DEVICE ---
  /** Ausência inicial de dados de CGM (parametrizada por dispositivo). */
  CGM_DATA_GAP = 'CGM_DATA_GAP',
  /** Ausência persistente de dados de CGM. */
  CGM_DATA_GAP_PERSISTENT = 'CGM_DATA_GAP_PERSISTENT',

  // --- CARE_MANAGEMENT ---
  /** Lacuna assistencial — referencia um CareGap (fonte-da-verdade). */
  CARE_GAP = 'CARE_GAP',
  /** Oportunidade de cuidado (não é lacuna aberta). */
  OPPORTUNITY = 'OPPORTUNITY',
}

/** Subtipos válidos por domínio (para validação declarativa). */
export const SUBTYPES_BY_DOMAIN: Record<string, AlertSubtype[]> = {
  CLINICAL: [
    AlertSubtype.HYPOGLYCEMIA_LEVEL_1,
    AlertSubtype.HYPOGLYCEMIA_LEVEL_2,
    AlertSubtype.HYPOGLYCEMIA_LEVEL_3,
    AlertSubtype.HYPERGLYCEMIA_MARKED,
    AlertSubtype.HYPERGLYCEMIA_SUSTAINED,
    AlertSubtype.SUSPECTED_DKA,
  ],
  DEVICE: [AlertSubtype.CGM_DATA_GAP, AlertSubtype.CGM_DATA_GAP_PERSISTENT],
  CARE_MANAGEMENT: [AlertSubtype.CARE_GAP, AlertSubtype.OPPORTUNITY],
};
