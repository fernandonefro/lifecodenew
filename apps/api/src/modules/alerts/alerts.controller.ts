import { Controller, Get, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { ResolveAlertDto } from './dto/resolve-alert.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';

@ApiTags('Alertas Clínicos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Fila de atendimento: alertas ativos ordenados por urgência (P0 no topo)' })
  @ApiResponse({ status: 200, description: 'Lista de alertas ativos.' })
  async list(@Req() req: any) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.alertsService.getQueue(tenantId);
  }

  @Patch(':id/assume')
  @ApiOperation({ summary: 'Assumir (lock) um alerta OPEN' })
  @ApiResponse({ status: 200, description: 'Alerta assumido.' })
  @ApiResponse({ status: 409, description: 'Alerta já está sendo tratado por outro profissional.' })
  async assume(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.alertsService.assume(tenantId, id, req.user?.userId);
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Resolver (fechar) um alerta assumido, com conduta clínica' })
  @ApiResponse({ status: 200, description: 'Alerta resolvido.' })
  @ApiResponse({ status: 409, description: 'Alerta não está em atendimento pelo profissional.' })
  async resolve(@Req() req: any, @Param('id') id: string, @Body() dto: ResolveAlertDto) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.alertsService.resolve(tenantId, id, req.user?.userId, dto);
  }
}
