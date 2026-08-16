import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MedicationsService } from './medications.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';

describe('MedicationsService (V3.4 - Medicação)', () => {
  let service: MedicationsService;
  let prismaMock: any;
  let auditMock: any;

  beforeEach(async () => {
    prismaMock = {
      patient: { findFirst: jest.fn().mockResolvedValue({ id: 'p1' }) },
      medication: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'm1', ...data })),
        updateMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ id: 'm1', active: false }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    auditMock = { record: jest.fn() };

    const mod: TestingModule = await Test.createTestingModule({
      providers: [
        MedicationsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
      ],
    }).compile();
    service = mod.get<MedicationsService>(MedicationsService);
  });

  const dto = {
    patientId: 'p1', name: 'Metformina', drugClass: 'biguanida',
    dose: '850mg', frequency: '2x/dia', startDate: '2026-08-14',
  };

  it('cria medicação com via padrão oral + auditoria', async () => {
    const res: any = await service.create('t1', 'actor', dto as any);
    expect(res.status).toBe('CREATED');
    expect(prismaMock.medication.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: 'Metformina', route: 'oral', tenantId: 't1' }) }),
    );
    expect(auditMock.record).toHaveBeenCalled();
  });

  it('404 se o paciente não pertence ao tenant', async () => {
    prismaMock.patient.findFirst.mockResolvedValue(null);
    await expect(service.create('t1', 'actor', dto as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('suspende uma medicação ativa (updateMany guardado por active=true)', async () => {
    prismaMock.medication.updateMany.mockResolvedValue({ count: 1 });
    const res: any = await service.suspend('t1', 'actor', 'm1');
    expect(res.status).toBe('OK');
    expect(prismaMock.medication.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'm1', tenantId: 't1', active: true }),
        data: expect.objectContaining({ active: false }),
      }),
    );
  });

  it('409 ao suspender medicação já suspensa', async () => {
    prismaMock.medication.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.medication.findFirst.mockResolvedValue({ id: 'm1', active: false });
    await expect(service.suspend('t1', 'actor', 'm1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('404 ao suspender medicação inexistente', async () => {
    prismaMock.medication.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.medication.findFirst.mockResolvedValue(null);
    await expect(service.suspend('t1', 'actor', 'x')).rejects.toBeInstanceOf(NotFoundException);
  });
});
