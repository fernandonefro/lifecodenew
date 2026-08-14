import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { GlucoseService } from './glucose.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { ConsentService } from '../../common/audit/consent.service';
import { AlertSeverity, MeasurementSource, MeasurementContext } from '@lifecode/shared';

/**
 * S1 — Conversão mmol/L → mg/dL no fluxo real (antes vivia só no .transform()
 *      do Zod, fora da rota) + S2 (parte) — plausibilidade fisiológica no service.
 */
describe('GlucoseService - Normalização de unidade (S1) e plausibilidade (S2)', () => {
  let service: GlucoseService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      clinicalObservation: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'obs-123', ...data })),
      },
      alert: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'alert-123', ...data })),
      },
      $transaction: jest.fn((cb) => cb(prismaMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlucoseService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: { record: jest.fn() } },
        { provide: ConsentService, useValue: { assertActiveConsent: jest.fn().mockResolvedValue('user-x') } },
      ],
    }).compile();

    service = module.get<GlucoseService>(GlucoseService);
  });

  const baseInput = (over: Record<string, any> = {}) => ({
    patientId: '11111111-1111-1111-1111-111111111111',
    externalEventId: 'evt-x',
    value: 0,
    unit: 'mg/dL',
    sourceType: MeasurementSource.MANUAL,
    context: MeasurementContext.RANDOM,
    measuredAt: '2026-08-13T10:00:00.000Z',
    ...over,
  });

  it('S1: 15 mmol/L é persistido como 270 mg/dL e classificado P1 (não P0)', async () => {
    const res: any = await service.ingestGlucose(
      'tenant-1',
      baseInput({ value: 15, unit: 'mmol/L', externalEventId: 'evt-mmol-15' }) as any,
    );

    // 15 * 18.0182 = 270.27 -> 270
    expect(prismaMock.clinicalObservation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ value: 270, unit: 'mg/dL' }) }),
    );
    expect(res.alertTriggered).toBe(AlertSeverity.P1_HIGH_RISK);
  });

  it('S1: valor cru de mmol/L NÃO dispara P0 falso (regressão do bug)', async () => {
    // No bug antigo, value=15 caía em "value < 54" e gerava P0_EMERGENCY.
    const res: any = await service.ingestGlucose(
      'tenant-1',
      baseInput({ value: 15, unit: 'mmol/L', externalEventId: 'evt-mmol-15b' }) as any,
    );
    expect(res.alertTriggered).not.toBe(AlertSeverity.P0_EMERGENCY);
  });

  it('S1: preserva valor/unidade originais no metadata', async () => {
    await service.ingestGlucose(
      'tenant-1',
      baseInput({ value: 15, unit: 'mmol/L', externalEventId: 'evt-mmol-meta' }) as any,
    );
    const call = prismaMock.clinicalObservation.create.mock.calls[0][0];
    const meta = JSON.parse(call.data.metadata);
    expect(meta.originalValue).toBe(15);
    expect(meta.originalUnit).toBe('mmol/L');
  });

  it('S1: leitura em mg/dL passa sem conversão (270 mg/dL -> P1)', async () => {
    const res: any = await service.ingestGlucose(
      'tenant-1',
      baseInput({ value: 270, unit: 'mg/dL', externalEventId: 'evt-mgdl-270' }) as any,
    );
    expect(prismaMock.clinicalObservation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ value: 270, unit: 'mg/dL' }) }),
    );
    expect(res.alertTriggered).toBe(AlertSeverity.P1_HIGH_RISK);
  });

  it('S2: rejeita valor implausivelmente alto (5000 mg/dL -> 400)', async () => {
    await expect(
      service.ingestGlucose('tenant-1', baseInput({ value: 5000, externalEventId: 'evt-huge' }) as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.clinicalObservation.create).not.toHaveBeenCalled();
  });

  it('S2: rejeita valor implausivelmente baixo (5 mg/dL -> 400)', async () => {
    await expect(
      service.ingestGlucose('tenant-1', baseInput({ value: 5, externalEventId: 'evt-low' }) as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
