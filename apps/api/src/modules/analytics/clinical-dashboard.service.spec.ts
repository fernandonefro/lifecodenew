import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalDashboardService } from './clinical-dashboard.service';
import { PrismaService } from '../../database/prisma.service';

/**
 * V3.5 — Dashboard Médico: agregação operacional derivada do banco.
 * Valida escopo por tenant, mapeamento de contagens e resiliência a estados ausentes.
 */
describe('ClinicalDashboardService (V3.5)', () => {
  let service: ClinicalDashboardService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      patient: { count: jest.fn().mockResolvedValue(120) },
      alert: {
        groupBy: jest.fn(),
        count: jest.fn().mockResolvedValue(3),
      },
      careGap: { groupBy: jest.fn() },
      clinicalObservation: { count: jest.fn().mockResolvedValue(42) },
    };

    // 1ª chamada de alert.groupBy = por status; 2ª = por severidade (ativos).
    prismaMock.alert.groupBy
      .mockResolvedValueOnce([
        { status: 'OPEN', _count: { _all: 5 } },
        { status: 'ACKNOWLEDGED', _count: { _all: 2 } },
        { status: 'RESOLVED', _count: { _all: 11 } },
      ])
      .mockResolvedValueOnce([
        { severity: 'P0', _count: { _all: 1 } },
        { severity: 'P1', _count: { _all: 4 } },
        { severity: 'P2', _count: { _all: 2 } },
      ]);
    prismaMock.careGap.groupBy.mockResolvedValue([
      { status: 'OVERDUE', _count: { _all: 8 } },
      { status: 'SCHEDULED', _count: { _all: 3 } },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicalDashboardService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ClinicalDashboardService>(ClinicalDashboardService);
  });

  it('agrega contagens de pacientes, alertas, lacunas e atividade', async () => {
    const r = await service.getOverview('t1');

    expect(r.totalPatients).toBe(120);
    expect(r.alerts.open).toBe(5);
    expect(r.alerts.inProgress).toBe(2);
    expect(r.alerts.resolved).toBe(11);
    expect(r.alerts.active).toBe(7); // open + acknowledged
    expect(r.alerts.overdue).toBe(3);
    expect(r.alerts.bySeverity).toEqual({ P0: 1, P1: 4, P2: 2, P3: 0 });
    expect(r.careGaps).toEqual({ overdue: 8, scheduled: 3, closed: 0 });
    expect(r.activity.observationsLast7Days).toBe(42);
    expect(typeof r.generatedAt).toBe('string');
  });

  it('escopa todas as queries por tenantId (isolamento multi-tenant CA-01)', async () => {
    await service.getOverview('tenant-xyz');

    expect(prismaMock.patient.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-xyz' }) }),
    );
    for (const call of prismaMock.alert.groupBy.mock.calls) {
      expect(call[0].where).toEqual(expect.objectContaining({ tenantId: 'tenant-xyz' }));
    }
    expect(prismaMock.alert.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-xyz', status: 'OPEN' }) }),
    );
    expect(prismaMock.careGap.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-xyz' } }),
    );
    expect(prismaMock.clinicalObservation.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-xyz' }) }),
    );
  });

  it('retorna zeros quando não há dados (banco vazio), sem quebrar', async () => {
    prismaMock.patient.count.mockResolvedValue(0);
    prismaMock.alert.groupBy.mockReset().mockResolvedValue([]);
    prismaMock.alert.count.mockResolvedValue(0);
    prismaMock.careGap.groupBy.mockResolvedValue([]);
    prismaMock.clinicalObservation.count.mockResolvedValue(0);

    const r = await service.getOverview('t-empty');

    expect(r.totalPatients).toBe(0);
    expect(r.alerts).toEqual(
      expect.objectContaining({ open: 0, inProgress: 0, resolved: 0, active: 0, overdue: 0 }),
    );
    expect(r.alerts.bySeverity).toEqual({ P0: 0, P1: 0, P2: 0, P3: 0 });
    expect(r.careGaps).toEqual({ overdue: 0, scheduled: 0, closed: 0 });
    expect(r.activity.observationsLast7Days).toBe(0);
  });
});
