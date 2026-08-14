import { ForbiddenException } from '@nestjs/common';
import { ConsentService } from './consent.service';

describe('ConsentService (S3 - LGPD)', () => {
  let prismaMock: any;
  let service: ConsentService;

  beforeEach(() => {
    prismaMock = {
      patient: { findFirst: jest.fn() },
      consentLog: { findMany: jest.fn() },
    };
    service = new ConsentService(prismaMock);
  });

  it('passa e retorna o userId quando TCLE + LGPD estão consentidos', async () => {
    prismaMock.patient.findFirst.mockResolvedValue({ userId: 'u1' });
    prismaMock.consentLog.findMany.mockResolvedValue([
      { scope: 'TCLE_TERMS_OF_SERVICE' },
      { scope: 'PRIVACY_POLICY_LGPD' },
    ]);
    await expect(service.assertActiveConsent('t1', 'p1')).resolves.toBe('u1');
  });

  it('bloqueia (403) quando falta um escopo obrigatório', async () => {
    prismaMock.patient.findFirst.mockResolvedValue({ userId: 'u1' });
    prismaMock.consentLog.findMany.mockResolvedValue([{ scope: 'TCLE_TERMS_OF_SERVICE' }]);
    await expect(service.assertActiveConsent('t1', 'p1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('bloqueia (403) quando o paciente não existe no tenant', async () => {
    prismaMock.patient.findFirst.mockResolvedValue(null);
    await expect(service.assertActiveConsent('t1', 'p-x')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
