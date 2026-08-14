import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { ResolveAlertDto } from './dto/resolve-alert.dto';

// Ordem de urgência para a fila (P0 no topo).
const SEVERITY_RANK: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Fila de atendimento: alertas ativos (OPEN + ACKNOWLEDGED) do tenant,
   * ordenados por severidade (P0 primeiro) e depois pelo SLA (dueDate).
   */
  async getQueue(tenantId: string) {
    const alerts = await this.prisma.alert.findMany({
      where: { tenantId, status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
      include: { patient: { include: { user: { select: { fullName: true } } } } },
    });

    // Busca os valores das observações relacionadas (não há relação direta no schema).
    const obsIds = alerts
      .map((a) => a.observationId)
      .filter((id): id is string => Boolean(id));
    const observations = obsIds.length
      ? await this.prisma.clinicalObservation.findMany({
          where: { id: { in: obsIds } },
          select: { id: true, value: true, unit: true },
        })
      : [];
    const obsMap = new Map(observations.map((o) => [o.id, o]));

    return alerts
      .sort(
        (a, b) =>
          (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9) ||
          a.dueDate.getTime() - b.dueDate.getTime(),
      )
      .map((a) => {
        const obs = a.observationId ? obsMap.get(a.observationId) : undefined;
        return {
          id: a.id,
          severity: a.severity,
          status: a.status,
          title: a.title,
          message: a.message,
          patientName: a.patient?.user?.fullName ?? 'Paciente',
          glucoseValue: obs ? Number(obs.value) : null,
          unit: obs?.unit ?? 'mg/dL',
          dueDate: a.dueDate,
          assignedToUserId: a.assignedToUserId,
          createdAt: a.createdAt,
        };
      });
  }

  /**
   * Assume (lock) um alerta. A transição OPEN -> ACKNOWLEDGED é atômica via
   * updateMany com guarda de status: se dois profissionais tentarem ao mesmo
   * tempo, apenas o primeiro afeta 1 linha; o segundo recebe 409.
   */
  async assume(tenantId: string, alertId: string, userId: string) {
    const result = await this.prisma.alert.updateMany({
      where: { id: alertId, tenantId, status: 'OPEN' },
      data: { status: 'ACKNOWLEDGED', assignedToUserId: userId, acknowledgedAt: new Date() },
    });

    if (result.count === 0) {
      const existing = await this.prisma.alert.findFirst({ where: { id: alertId, tenantId } });
      if (!existing) throw new NotFoundException('Alerta não encontrado.');
      throw new ConflictException('Alerta já está sendo tratado por outro profissional');
    }

    this.logger.log(`Alerta ${alertId} assumido por ${userId}`);
    await this.audit.record({
      tenantId, userId, action: 'ASSUME_ALERT', resource: 'alert',
      newValue: { alertId, status: 'ACKNOWLEDGED' },
    });
    return { status: 'OK', data: await this.prisma.alert.findUnique({ where: { id: alertId } }) };
  }

  /**
   * Resolve (fecha) um alerta. Exige que ele esteja ACKNOWLEDGED e assumido
   * pelo próprio profissional (ownership). Registra conduta + notas.
   */
  async resolve(tenantId: string, alertId: string, userId: string, dto: ResolveAlertDto) {
    const result = await this.prisma.alert.updateMany({
      where: { id: alertId, tenantId, status: 'ACKNOWLEDGED', assignedToUserId: userId },
      data: {
        status: 'RESOLVED',
        disposition: dto.disposition,
        resolutionNotes: dto.notes ?? null,
        resolvedAt: new Date(),
      },
    });

    if (result.count === 0) {
      const existing = await this.prisma.alert.findFirst({ where: { id: alertId, tenantId } });
      if (!existing) throw new NotFoundException('Alerta não encontrado.');
      throw new ConflictException(
        'Alerta não está em atendimento por você — assuma o caso antes de resolver.',
      );
    }

    this.logger.log(`Alerta ${alertId} resolvido por ${userId} (${dto.disposition})`);
    await this.audit.record({
      tenantId, userId, action: 'RESOLVE_ALERT', resource: 'alert',
      newValue: { alertId, status: 'RESOLVED', disposition: dto.disposition },
    });
    return { status: 'OK', data: await this.prisma.alert.findUnique({ where: { id: alertId } }) };
  }
}
