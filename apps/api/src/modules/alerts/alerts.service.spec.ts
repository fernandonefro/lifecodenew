import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AlertDisposition } from './dto/resolve-alert.dto';

/**
 * A4 — Fila de alertas: ordenação por urgência e lock de concorrência
 * (assunção atômica via updateMany guardado por status).
 */
describe('AlertsService (A4)', () => {
  let service: AlertsService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      alert: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ id: 'a1', status: 'ACKNOWLEDGED' }),
      },
      clinicalObservation: {
        findMany: jest.fn().mockResolvedValue([{ id: 'obs-1', value: 45, unit: 'mg/dL' }]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: { record: jest.fn() } },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
  });

  it('getQueue: ordena P0 no topo, mesmo vindo desordenado do banco', async () => {
    const now = new Date('2026-08-13T12:00:00Z');
    prismaMock.alert.findMany.mockResolvedValue([
      { id: 'a-p1', severity: 'P1', status: 'OPEN', title: '', message: '', dueDate: now, observationId: null, assignedToUserId: null, createdAt: now, patient: { user: { fullName: 'Fulano' } } },
      { id: 'a-p0', severity: 'P0', status: 'OPEN', title: '', message: '', dueDate: now, observationId: 'obs-1', assignedToUserId: null, createdAt: now, patient: { user: { fullName: 'Ciclana' } } },
    ]);

    const queue = await service.getQueue('t1');
    expect(queue[0].id).toBe('a-p0');
    expect(queue[0].severity).toBe('P0');
    expect(queue[0].glucoseValue).toBe(45);
    expect(queue[1].id).toBe('a-p1');
  });

  it('assume: sucesso quando o alerta está OPEN', async () => {
    prismaMock.alert.updateMany.mockResolvedValue({ count: 1 });
    const res = await service.assume('t1', 'a1', 'user-1');
    expect(res.status).toBe('OK');
    expect(prismaMock.alert.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 'a1', tenantId: 't1', status: 'OPEN' }) }),
    );
  });

  it('assume: 409 quando já assumido por outro (updateMany afeta 0 linhas)', async () => {
    prismaMock.alert.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.alert.findFirst.mockResolvedValue({ id: 'a1', status: 'ACKNOWLEDGED' });
    await expect(service.assume('t1', 'a1', 'user-2')).rejects.toBeInstanceOf(ConflictException);
  });

  it('assume: 404 quando o alerta não existe', async () => {
    prismaMock.alert.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.alert.findFirst.mockResolvedValue(null);
    await expect(service.assume('t1', 'inexistente', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('resolve: sucesso quando ACKNOWLEDGED e assumido pelo próprio usuário', async () => {
    prismaMock.alert.updateMany.mockResolvedValue({ count: 1 });
    const res = await service.resolve('t1', 'a1', 'user-1', {
      disposition: AlertDisposition.PATIENT_CONTACTED_STABLE,
      notes: 'ok',
    });
    expect(res.status).toBe('OK');
    expect(prismaMock.alert.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'a1', tenantId: 't1', status: 'ACKNOWLEDGED', assignedToUserId: 'user-1' }),
        data: expect.objectContaining({ status: 'RESOLVED', disposition: 'PATIENT_CONTACTED_STABLE' }),
      }),
    );
  });

  it('resolve: 409 quando não está em atendimento pelo usuário', async () => {
    prismaMock.alert.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.alert.findFirst.mockResolvedValue({ id: 'a1', status: 'OPEN' });
    await expect(
      service.resolve('t1', 'a1', 'user-1', { disposition: AlertDisposition.FALSE_ALARM }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
