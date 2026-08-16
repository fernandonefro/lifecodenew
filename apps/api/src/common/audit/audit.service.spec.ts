import { AuditService } from './audit.service';

describe('AuditService (S3 - HMAC)', () => {
  let prismaMock: any;
  let service: AuditService;

  const entry = {
    tenantId: 't1',
    userId: 'u1',
    action: 'INGEST_GLUCOSE',
    resource: 'clinical_observation',
    newValue: { v: 42 },
  };

  beforeEach(() => {
    prismaMock = { auditLog: { create: jest.fn().mockResolvedValue({}) } };
    service = new AuditService(prismaMock);
  });

  it('assinatura HMAC é determinística para o mesmo payload/timestamp', () => {
    const ts = '2026-08-13T12:00:00.000Z';
    expect(service.sign(entry, ts)).toBe(service.sign(entry, ts));
  });

  it('conteúdo diferente => assinatura diferente (tamper-evident)', () => {
    const ts = '2026-08-13T12:00:00.000Z';
    expect(service.sign(entry, ts)).not.toBe(service.sign({ ...entry, newValue: { v: 43 } }, ts));
  });

  it('record grava AuditLog com hmacSignature', async () => {
    await service.record(entry);
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'INGEST_GLUCOSE', hmacSignature: expect.any(String) }),
      }),
    );
  });

  it('falha de gravação NÃO propaga (best-effort, não derruba a operação clínica)', async () => {
    prismaMock.auditLog.create.mockRejectedValue(new Error('db down'));
    await expect(service.record(entry)).resolves.toBeUndefined();
  });
});
