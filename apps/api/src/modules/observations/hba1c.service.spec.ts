import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { Hba1cService } from './hba1c.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { ConsentService } from '../../common/audit/consent.service';

describe('Hba1cService (V3.4 - HbA1c)', () => {
  let service: Hba1cService;
  let prismaMock: any;
  let auditMock: any;
  let consentMock: any;

  beforeEach(async () => {
    prismaMock = {
      clinicalObservation: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'obs-h', ...data })),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    auditMock = { record: jest.fn() };
    consentMock = { assertActiveConsent: jest.fn().mockResolvedValue('u1') };

    const mod: TestingModule = await Test.createTestingModule({
      providers: [
        Hba1cService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
        { provide: ConsentService, useValue: consentMock },
      ],
    }).compile();
    service = mod.get<Hba1cService>(Hba1cService);
  });

  const dto = { patientId: '11111111-1111-4111-8111-111111111111', valuePercent: 7.2, measuredAt: '2026-08-01' };

  it('registra HbA1c como observação LOINC 4548-4 em % + auditoria', async () => {
    const res: any = await service.ingest('t1', 'actor', dto);
    expect(res.status).toBe('CREATED');
    expect(prismaMock.clinicalObservation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ loincCode: '4548-4', unit: '%', value: 7.2 }) }),
    );
    expect(auditMock.record).toHaveBeenCalled();
  });

  it('bloqueia sem consentimento (403) e não cria observação', async () => {
    consentMock.assertActiveConsent.mockRejectedValue(new ForbiddenException('sem consentimento'));
    await expect(service.ingest('t1', 'actor', dto)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prismaMock.clinicalObservation.create).not.toHaveBeenCalled();
  });

  it('idempotência: externalEventId já existente → skip', async () => {
    prismaMock.clinicalObservation.findFirst.mockResolvedValue({ id: 'exists' });
    const res: any = await service.ingest('t1', 'actor', { ...dto, externalEventId: 'e1' });
    expect(res.status).toBe('IDEMPOTENT_SKIPPED');
    expect(prismaMock.clinicalObservation.create).not.toHaveBeenCalled();
  });
});
