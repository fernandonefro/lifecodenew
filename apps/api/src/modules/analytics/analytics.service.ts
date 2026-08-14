import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resumo de Estratificação de Risco Populacional por Tiers (Tier 1 Alto, Tier 2 Médio, Tier 3 Baixo)
   */
  async getPopulationRiskSummary(tenantId: string) {
    const totalBeneficiaries = await this.prisma.patient.count({ where: { tenantId } });

    const tierCounts = await this.prisma.riskStratification.groupBy({
      by: ['tier'],
      where: { tenantId },
      _count: { patientId: true },
    });

    const tierMap: Record<string, number> = {
      TIER_1_HIGH: 0,
      TIER_2_MODERATE: 0,
      TIER_3_LOW: 0,
    };
    tierCounts.forEach((tc: any) => {
      if (tc.tier && tierMap[tc.tier] !== undefined) {
        tierMap[tc.tier] = tc._count?.patientId || 0;
      }
    });

    const pct = (n: number) =>
      totalBeneficiaries > 0 ? parseFloat(((n / totalBeneficiaries) * 100).toFixed(1)) : 0;

    // 100% derivado do banco — sem fallback mock.
    return {
      totalBeneficiaries,
      tier1HighRisk: { count: tierMap.TIER_1_HIGH, percentage: pct(tierMap.TIER_1_HIGH) },
      tier2ModerateRisk: { count: tierMap.TIER_2_MODERATE, percentage: pct(tierMap.TIER_2_MODERATE) },
      tier3LowRisk: { count: tierMap.TIER_3_LOW, percentage: pct(tierMap.TIER_3_LOW) },
      lastCalculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Lista Priorizada de Lacunas de Cuidado (Care Gaps Vencidas)
   */
  async getCareGaps(tenantId: string) {
    const gaps = await this.prisma.careGap.findMany({
      where: { tenantId, status: 'OVERDUE' },
      include: {
        patient: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 50,
    });

    // 100% derivado do banco — sem fallback mock (lista vazia se não houver gaps).
    return gaps.map((g: any) => ({
      id: g.id,
      patientName: g.patient?.user?.fullName || 'Paciente',
      gapType: g.gapType,
      title: g.title,
      dueDate: g.dueDate,
      daysOverdue: Math.floor((new Date().getTime() - new Date(g.dueDate).getTime()) / (1000 * 3600 * 24)),
    }));
  }

  /**
   * Indicadores de Utilização Hospitalar — lê a métrica populacional mais
   * recente do banco (tabela population_metrics). Sem fallback mock: se não há
   * métrica calculada, retorna zeros e periodMonth nulo.
   */
  async getUtilizationMetrics(tenantId: string) {
    const metric = await this.prisma.populationMetric.findFirst({
      where: { tenantId },
      orderBy: { periodMonth: 'desc' },
    });

    if (!metric) {
      return {
        periodMonth: null,
        totalBeneficiaries: 0,
        erVisitsCount: 0,
        hospitalizationsCount: 0,
        erVisitsPerThousand: 0,
        inpatientAdmissionsPerThousand: 0,
        calculatedAt: null,
      };
    }

    return {
      periodMonth: metric.periodMonth,
      totalBeneficiaries: metric.totalBeneficiaries,
      erVisitsCount: metric.erVisitsCount,
      hospitalizationsCount: metric.hospitalizationsCount,
      erVisitsPerThousand: Number(metric.erRatePerThousand),
      inpatientAdmissionsPerThousand: Number(metric.inpatientRatePerThousand),
      calculatedAt: metric.calculatedAt,
    };
  }
}
