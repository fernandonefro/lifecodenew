import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OperatorAnalyticsService } from './operator-analytics.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles, Role } from '../../auth/roles.decorator';

@ApiTags('Portal da Operadora - Analytics Populacional')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(Role.ANALISTA_OPERADORA, Role.GESTOR_CLINICA, Role.ADMIN)
@Controller('operator/analytics')
export class OperatorAnalyticsController {
  constructor(private readonly operatorAnalyticsService: OperatorAnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Visão Geral Populacional de Risco e Lacunas (US-21 + US-22)' })
  @ApiResponse({ status: 200, description: 'Indicadores populacionais retornados com sucesso.' })
  async getOverview(@Req() req: any) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] || 'tenant-default';
    return await this.operatorAnalyticsService.getPopulationOverview(tenantId);
  }
}
