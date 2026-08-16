import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const SEVERITIES = ['P0', 'P1', 'P2', 'P3'] as const;
const SEVEN_DAYS_MS = 7 * 24 * 3600 * 1000;

/**
 * Dashboard Médico (V3.5) — visão operacional da equipe clínica/navegação.
 *
 * Responde "quantos pacientes na carteira, quantos alertas abertos/vencidos e
 * quantas lacunas de cuidado pendentes" a partir do banco (sem mock). É
 * SOMENTE LEITURA e agrega apenas contagens — não expõe dado identificável de
 * paciente. Toda query é escopada por `tenantId` (isolamento multi-tenant, CA-01).
 *
 * NÃO é o motor de regras clínicas: não emite, reclassifica nem prioriza
 * alertas. Apenas conta o que a fila de alertas (A4) e as lacunas de cuidado
 * já produziram.
 */
@Injectable()
export class ClinicalDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(tenantId: string) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS);

    const [
      totalPatients,
      alertsByStatus,
      overdueOpenAlerts,
      activeAlertsBySeverity,
      careGapsByStatus,
      observationsLast7Days,
    ] = await Promise.all([
      this.prisma.patient.count({ where: { tenantId } }),
      this.prisma.alert.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { _all: true },
      }),
      // Alertas ainda abertos cujo prazo (dueDate) já passou.
      this.prisma.alert.count({
        where: { tenantId, status: 'OPEN', dueDate: { lt: now } },
      }),
      // Severidade apenas dos alertas ativos (não resolvidos).
      this.prisma.alert.groupBy({
        by: ['severity'],
        where: { tenantId, status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
        _count: { _all: true },
      }),
      this.prisma.careGap.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { _all: true },
      }),
      // Sinal de atividade: leituras medidas nos últimos 7 dias.
      this.prisma.clinicalObservation.count({
        where: { tenantId, measuredAt: { gte: sevenDaysAgo } },
      }),
    ]);

    const countByStatus = (rows: any[], key: string) => {
      const row = rows.find((r) => r.status === key);
      return row?._count?._all ?? 0;
    };

    const bySeverity: Record<string, number> = {};
    for (const s of SEVERITIES) {
      const row = activeAlertsBySeverity.find((r: any) => r.severity === s);
      bySeverity[s] = row?._count?._all ?? 0;
    }

    const open = countByStatus(alertsByStatus, 'OPEN');
    const acknowledged = countByStatus(alertsByStatus, 'ACKNOWLEDGED');
    const resolved = countByStatus(alertsByStatus, 'RESOLVED');

    return {
      totalPatients,
      alerts: {
        open,
        inProgress: acknowledged,
        resolved,
        overdue: overdueOpenAlerts,
        active: open + acknowledged,
        bySeverity,
      },
      careGaps: {
        overdue: countByStatus(careGapsByStatus, 'OVERDUE'),
        scheduled: countByStatus(careGapsByStatus, 'SCHEDULED'),
        closed: countByStatus(careGapsByStatus, 'CLOSED'),
      },
      activity: {
        observationsLast7Days,
      },
      generatedAt: now.toISOString(),
    };
  }
}
