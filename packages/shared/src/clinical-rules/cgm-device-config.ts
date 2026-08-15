/**
 * Configuração de detecção de gap por integração/dispositivo CGM.
 *
 * NÃO há um limiar único de 15 min para todos os fabricantes. Sem configuração confiável,
 * a regra de data gap permanece DISABLED. Ver docs/adr/ADR-0002-motor-regras-clinicas.md.
 *
 * Todos os campos numéricos são PENDENTES de dados reais de fabricante/integração — não
 * inventar valores. Um registro sem `initialGapThresholdMinutes`/`persistentGapThresholdMinutes`
 * confiável mantém a regra inerte.
 */
export interface CgmDeviceConfig {
  /** Identificador da integração/fabricante (ex.: 'dexcom-g6', 'libre-3'). */
  integrationCode: string;
  expectedReadingIntervalMinutes?: number;
  ingestionLatencyP95Minutes?: number;
  initialGapThresholdMinutes?: number;
  persistentGapThresholdMinutes?: number;
  warmupDurationMinutes?: number;
  /** Se false/undefined, a detecção de gap NÃO deve rodar para este dispositivo. */
  configTrusted?: boolean;
}

/**
 * Registro (vazio por padrão) de configurações confiáveis. Preenchido apenas com dados
 * reais de integração aprovados — mantido vazio aqui para NÃO inventar parâmetros.
 */
export const CGM_DEVICE_CONFIGS: Readonly<Record<string, CgmDeviceConfig>> = Object.freeze({});
