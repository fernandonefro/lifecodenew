import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ClinicalDashboardService } from './clinical-dashboard.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles, Role } from '../../auth/roles.decorator';

/**
 * Dashboard Médico (V3.5) — endpoint da equipe clínica/navegação, distinto do
 * Portal da Operadora (analytics populacional). Papéis clínicos apenas.
 */
@ApiTags('Dashboard Médico - Equipe Clínica')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(Role.MEDICO, Role.NAVEGADOR, Role.GESTOR_CLINICA, Role.ADMIN)
@Controller('analytics')
export class ClinicalDashboardController {
  constructor(private readonly service: ClinicalDashboardService) {}

  @Get('clinical-dashboard')
  @ApiOperation({
    summary: 'Visão operacional da carteira: alertas, lacunas e atividade (V3.5)',
  })
  @ApiResponse({ status: 200, description: 'Resumo operacional derivado do banco.' })
  async getClinicalDashboard(@Req() req: any) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.service.getOverview(tenantId);
  }
}
