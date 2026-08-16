import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OperatorAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Indicadores resumidos da população coberta (US-21 + US-22), 100% derivados
   * do banco. Sem fallback mock: um banco vazio retorna zeros reais, não números
   * fabricados (que antes mascaravam o estado real do sistema).
   */
  async getPopulationOverview(tenantId: string) {
    const totalPatients = await this.prisma.patient.count({ where: { tenantId } });

    // 1. Contagem por Tiers de Risco (US-21)
    const riskDistribution = await this.prisma.riskStratification.groupBy({
      by: ['tier'],
      where: { tenantId },
      _count: { _all: true },
    });

    // 2. Lacunas de Cuidado ativas por tipo (US-22)
    const activeCareGaps = await this.prisma.careGap.groupBy({
      by: ['gapType'],
      where: { tenantId, status: 'OVERDUE' },
      _count: { _all: true },
    });

    // 3. Ativação: pacientes com observação nos últimos 30 dias
    const activePatients30Days = await this.prisma.patient.count({
      where: {
        tenantId,
        clinicalObservations: {
          some: { measuredAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        },
      },
    });

    const highRisk = this.extractCount(riskDistribution, 'tier', 'TIER_1_HIGH');
    const moderateRisk = this.extractCount(riskDistribution, 'tier', 'TIER_2_MODERATE');
    const lowRisk = this.extractCount(riskDistribution, 'tier', 'TIER_3_LOW');

    const gapsSummary = activeCareGaps.map((gap) => ({
      gapType: gap.gapType,
      count: gap._count._all,
    }));

    return {
      population: {
        totalPatients,
        activePatients30Days,
        activationRatePercent: totalPatients > 0 ? Math.round((activePatients30Days / totalPatients) * 100) : 0,
      },
      riskTiers: { highRisk, moderateRisk, lowRisk },
      careGapsSummary: gapsSummary,
    };
  }

  private extractCount(arr: any[], key: string, targetValue: string): number {
    const item = arr.find((a) => a[key] === targetValue);
    return item ? item._count._all : 0;
  }
}
