/**
 * Domínio canônico do alerta — a NATUREZA do alerta, independente da prioridade.
 *
 * Ver docs/adr/ADR-0002-motor-regras-clinicas.md.
 *
 * REGRA (ADR-0001/0002): `alertDomain` é ortogonal a `priority` (P0–P3).
 * `CARE_GAP` e `OPPORTUNITY` NÃO são domínios — são subtipos de `CARE_MANAGEMENT`
 * (ver {@link AlertSubtype}).
 */
export enum AlertDomain {
  /** Evento clínico do paciente (glicemia, cetose, etc.). */
  CLINICAL = 'CLINICAL',
  /** Problema de dispositivo/telemetria (ex.: ausência de dados de CGM). Nunca um evento clínico. */
  DEVICE = 'DEVICE',
  /** Gestão de cuidado longitudinal (lacunas assistenciais, oportunidades). Fonte-da-verdade: modelo CareGap. */
  CARE_MANAGEMENT = 'CARE_MANAGEMENT',
}
