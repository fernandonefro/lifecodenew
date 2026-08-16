/**
 * Ciclo de vida de INCIDENTES clínicos e chave de deduplicação.
 *
 * Um incidente NÃO é criado a cada leitura: leituras dentro de um episódio aberto
 * atualizam o incidente existente. Ver docs/adr/ADR-0002-motor-regras-clinicas.md.
 */

export enum IncidentStatus {
  OPEN = 'OPEN',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
  CANCELLED = 'CANCELLED',
}

/** Estados em que um incidente ainda está "aberto" (candidato a atualização, não a novo alerta). */
export const OPEN_INCIDENT_STATUSES: IncidentStatus[] = [
  IncidentStatus.OPEN,
  IncidentStatus.ACKNOWLEDGED,
  IncidentStatus.IN_PROGRESS,
  IncidentStatus.ESCALATED,
];

/**
 * Chave de deduplicação de incidentes. Duas avaliações com a mesma chave, enquanto o
 * incidente estiver aberto, atualizam o MESMO incidente (idempotência).
 */
export interface IncidentDedupKey {
  patientId: string;
  ruleCode: string;
  ruleVersion: string;
  /** Origem/dispositivo (ex.: deviceId ou canal de ingestão). */
  source: string;
  /**
   * Identificador do episódio clínico contínuo. Deriva de janela temporal + período de
   * separação, calculado no backend — nunca do cliente.
   */
  episodeKey: string;
}

/** Serializa a chave de dedup de forma estável (ordem fixa dos campos). */
export function serializeDedupKey(k: IncidentDedupKey): string {
  return [k.patientId, k.ruleCode, k.ruleVersion, k.source, k.episodeKey].join('|');
}
