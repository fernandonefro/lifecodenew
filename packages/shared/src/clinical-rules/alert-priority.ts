import { AlertSeverity } from '../enums/alert-severity.enum';

/**
 * Prioridade OPERACIONAL do alerta (SLA). NÃO é diagnóstico nem significado clínico.
 *
 *   P0 — imediato/crítico
 *   P1 — curto prazo / mesmo dia
 *   P2 — prioritário, sem urgência imediata
 *   P3 — rotina / informativo
 *
 * Reaproveita os VALORES de {@link AlertSeverity} (`P0..P3`) para manter compatibilidade
 * com a coluna `alerts.severity` (String) e o `SEVERITY_RANK` da fila. O significado clínico
 * vive em {@link AlertDomain} + {@link AlertSubtype}, nunca aqui.
 */
export const AlertPriority = {
  P0: AlertSeverity.P0_EMERGENCY,
  P1: AlertSeverity.P1_HIGH_RISK,
  P2: AlertSeverity.P2_GAP,
  P3: AlertSeverity.P3_OPPORTUNITY,
} as const;

export type AlertPriority = (typeof AlertPriority)[keyof typeof AlertPriority];

/** Ordem de urgência (menor = mais urgente) — espelha o SEVERITY_RANK da fila. */
export const PRIORITY_RANK: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
