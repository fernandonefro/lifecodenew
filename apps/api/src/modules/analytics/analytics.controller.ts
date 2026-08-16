import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles, Role } from '../../auth/roles.decorator';

@ApiTags('Portal da Operadora - Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(Role.ANALISTA_OPERADORA, Role.GESTOR_CLINICA, Role.ADMIN)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('population-risk')
  @ApiOperation({ summary: 'Estratificação Populacional por Tiers de Risco (US-21)' })
  @ApiResponse({ status: 200, description: 'Distribuição de risco retornada com sucesso.' })
  async getPopulationRisk(@Req() req: any) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.analyticsService.getPopulationRiskSummary(tenantId);
  }

  @Get('care-gaps')
  @ApiOperation({ summary: 'Monitoramento de Lacunas de Cuidado Vencidas (US-21)' })
  @ApiResponse({ status: 200, description: 'Lista priorizada de lacunas de cuidado.' })
  async getCareGaps(@Req() req: any) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.analyticsService.getCareGaps(tenantId);
  }

  @Get('utilization-stats')
  @ApiOperation({ summary: 'Indicadores de Utilização Hospitalar / 1.000 Beneficiários (US-22)' })
  @ApiResponse({ status: 200, description: 'Taxas de PA e internações / 1.000 beneficiários.' })
  async getUtilizationStats(@Req() req: any) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.analyticsService.getUtilizationMetrics(tenantId);
  }
}
