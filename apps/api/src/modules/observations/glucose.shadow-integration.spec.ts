import { Test, TestingModule } from '@nestjs/testing';
import { GlucoseService } from './glucose.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { ConsentService } from '../../common/audit/consent.service';
import { MeasurementSource, MeasurementContext } from '@lifecode/shared';

/**
 * Prova de que o modo SHADOW NÃO altera o comportamento de emissão legado.
 * Com a flag LIGADA, a ingestão de um caso P0 deve continuar criando exatamente UM alerta
 * (o legado), sem alerta adicional do motor candidato.
 */
describe('GlucoseService — SHADOW não altera emissão legada', () => {
  let service: GlucoseService;
  let prismaMock: any;

  const P0_INPUT: any = {
    patientId: 'patient-shadow',
    externalEventId: 'evt-shadow-1',
    value: 42,
    unit: 'mg/dL',
    sourceType: MeasurementSource.MANUAL,
    context: MeasurementContext.FASTING,
    measuredAt: '2026-08-15T10:00:00.000Z',
    symptomsReported: { confusionOrAlteredConsciousness: true },
  };

  beforeEach(async () => {
    prismaMock = {
      clinicalObservation: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'obs-s', ...data })),
      },
      alert: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'alert-s', ...data })),
      },
      $transaction: jest.fn((cb) => cb(prismaMock)),
    };
    const mod: TestingModule = await Test.createTestingModule({
      providers: [
        GlucoseService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: { record: jest.fn() } },
        { provide: ConsentService, useValue: { assertActiveConsent: jest.fn().mockResolvedValue('u') } },
      ],
    }).compile();
    service = mod.get<GlucoseService>(GlucoseService);
  });

  afterEach(() => {
    delete process.env.CLINICAL_ENGINE_RULES_ENABLED;
    delete process.env.CLINICAL_ENGINE_SHADOW_ENABLED;
  });

  it('flag SHADOW ligada: continua criando exatamente 1 alerta (P0), sem alerta extra', async () => {
    process.env.CLINICAL_ENGINE_RULES_ENABLED = 'true';
    process.env.CLINICAL_ENGINE_SHADOW_ENABLED = 'true';
    const res: any = await service.ingestGlucose('tenant-s', P0_INPUT);
    expect(prismaMock.alert.create).toHaveBeenCalledTimes(1);
    expect(res.alertTriggered).toBe('P0');
  });

  it('flag desligada (padrão): comportamento idêntico — 1 alerta P0', async () => {
    const res: any = await service.ingestGlucose('tenant-s', { ...P0_INPUT, externalEventId: 'evt-shadow-2' });
    expect(prismaMock.alert.create).toHaveBeenCalledTimes(1);
    expect(res.alertTriggered).toBe('P0');
  });
});
