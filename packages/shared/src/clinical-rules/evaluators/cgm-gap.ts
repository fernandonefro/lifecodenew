import { AlertSubtype } from '../alert-subtype.enum';
import { CgmDeviceConfig } from '../cgm-device-config';

/**
 * Avaliador PURO de ausência de dados de CGM (DEVICE). NUNCA classifica ausência de leitura
 * como hipo/hiper/evento clínico. Sem configuração confiável de dispositivo, permanece inerte.
 * Ver docs/adr/ADR-0002.
 */

/** Motivos que EXCLUEM a detecção (não são falha real do fluxo do paciente). */
export interface CgmGapExclusions {
  warmup?: boolean;
  scheduledSensorSwap?: boolean;
  sensorEnded?: boolean;
  sharingPaused?: boolean;
  plannedMaintenance?: boolean;
  /** Indisponibilidade global da API → incidente técnico agregado, não alerta por paciente. */
  globalApiOutage?: boolean;
  /** Backlog conhecido da ingestão. */
  ingestionBacklog?: boolean;
}

export interface CgmGapInput {
  /** Minutos desde a última leitura VÁLIDA (derivado no backend; duplicadas/fora de ordem já tratadas). */
  minutesSinceLastValidReading: number;
  deviceConfig?: CgmDeviceConfig;
  exclusions?: CgmGapExclusions;
}

export type CgmGapReason =
  | 'DETECTED_INITIAL'
  | 'DETECTED_PERSISTENT'
  | 'NO_TRUSTED_CONFIG'
  | 'EXCLUDED'
  | 'GLOBAL_OUTAGE_AGGREGATE'
  | 'WITHIN_THRESHOLD';

export interface CgmGapResult {
  subtype: AlertSubtype | null;
  reason: CgmGapReason;
}

function anyExclusion(ex?: CgmGapExclusions): boolean {
  if (!ex) return false;
  return Boolean(
    ex.warmup ||
      ex.scheduledSensorSwap ||
      ex.sensorEnded ||
      ex.sharingPaused ||
      ex.plannedMaintenance ||
      ex.ingestionBacklog,
  );
}

export function evaluateCgmGap(input: CgmGapInput): CgmGapResult {
  // Falha global vira incidente técnico agregado — nunca um alerta por paciente.
  if (input.exclusions?.globalApiOutage) {
    return { subtype: null, reason: 'GLOBAL_OUTAGE_AGGREGATE' };
  }

  const cfg = input.deviceConfig;
  const trusted =
    !!cfg &&
    cfg.configTrusted === true &&
    typeof cfg.initialGapThresholdMinutes === 'number' &&
    typeof cfg.persistentGapThresholdMinutes === 'number';
  if (!trusted) {
    return { subtype: null, reason: 'NO_TRUSTED_CONFIG' };
  }

  if (anyExclusion(input.exclusions)) {
    return { subtype: null, reason: 'EXCLUDED' };
  }

  const mins = input.minutesSinceLastValidReading;
  if (mins >= (cfg!.persistentGapThresholdMinutes as number)) {
    return { subtype: AlertSubtype.CGM_DATA_GAP_PERSISTENT, reason: 'DETECTED_PERSISTENT' };
  }
  if (mins >= (cfg!.initialGapThresholdMinutes as number)) {
    return { subtype: AlertSubtype.CGM_DATA_GAP, reason: 'DETECTED_INITIAL' };
  }
  return { subtype: null, reason: 'WITHIN_THRESHOLD' };
}
