import { AlertSubtype, CgmDeviceConfig, evaluateCgmGap } from '@lifecode/shared';

const TRUSTED: CgmDeviceConfig = {
  integrationCode: 'test-cgm',
  initialGapThresholdMinutes: 20,
  persistentGapThresholdMinutes: 60,
  configTrusted: true,
};

describe('DEVICE — CGM data gap (config por dispositivo + exclusões)', () => {
  it('positivo: sensor ativo + integração saudável + ausência além do limiar inicial', () => {
    const r = evaluateCgmGap({ minutesSinceLastValidReading: 25, deviceConfig: TRUSTED });
    expect(r.subtype).toBe(AlertSubtype.CGM_DATA_GAP);
  });

  it('ausência persistente → CGM_DATA_GAP_PERSISTENT', () => {
    const r = evaluateCgmGap({ minutesSinceLastValidReading: 90, deviceConfig: TRUSTED });
    expect(r.subtype).toBe(AlertSubtype.CGM_DATA_GAP_PERSISTENT);
  });

  it('sem configuração confiável → inerte', () => {
    const r = evaluateCgmGap({ minutesSinceLastValidReading: 300 });
    expect(r.subtype).toBeNull();
    expect(r.reason).toBe('NO_TRUSTED_CONFIG');
  });

  const exclusions: Array<[string, any]> = [
    ['aquecimento', { warmup: true }],
    ['troca programada', { scheduledSensorSwap: true }],
    ['sensor encerrado', { sensorEnded: true }],
    ['compartilhamento pausado', { sharingPaused: true }],
    ['backlog interno', { ingestionBacklog: true }],
  ];
  it.each(exclusions)('exclusão: %s → não emite', (_label, ex) => {
    const r = evaluateCgmGap({
      minutesSinceLastValidReading: 300,
      deviceConfig: TRUSTED,
      exclusions: ex,
    });
    expect(r.subtype).toBeNull();
    expect(r.reason).toBe('EXCLUDED');
  });

  it('API global indisponível → incidente técnico agregado, não alerta por paciente', () => {
    const r = evaluateCgmGap({
      minutesSinceLastValidReading: 300,
      deviceConfig: TRUSTED,
      exclusions: { globalApiOutage: true },
    });
    expect(r.subtype).toBeNull();
    expect(r.reason).toBe('GLOBAL_OUTAGE_AGGREGATE');
  });
});
