/**
 * PRIORIDADE OPERACIONAL (SLA) do alerta — NÃO é diagnóstico nem significado clínico.
 * O significado clínico vive em AlertDomain + AlertSubtype (ver clinical-rules/, ADR-0002).
 *
 * ATENÇÃO: os NOMES dos membros `P2_GAP`/`P3_OPPORTUNITY` são apelidos LEGADOS mantidos
 * apenas por compatibilidade da coluna `alerts.severity` (String) e do `SEVERITY_RANK` da
 * fila. A antiga semântica (P2 = "lacuna de cuidado", P3 = "oportunidade") foi DESCONTINUADA:
 * P0–P3 significam exclusivamente prioridade operacional. Prefira `AlertPriority`
 * (clinical-rules/alert-priority) como acessor canônico.
 */
export enum AlertSeverity {
  P0_EMERGENCY = 'P0',   // P0 — imediato/crítico
  P1_HIGH_RISK = 'P1',   // P1 — curto prazo / mesmo dia
  P2_GAP = 'P2',         // P2 — prioritário, sem urgência imediata (nome do membro é legado)
  P3_OPPORTUNITY = 'P3', // P3 — rotina / informativo (nome do membro é legado)
}
