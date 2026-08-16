import { Controller, Post, Get, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GlucoseService } from './glucose.service';
import { IngestGlucoseDto } from './dto/ingest-glucose.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';

@ApiTags('Observações Clínicas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('observations/glucose')
export class GlucoseController {
  constructor(private readonly glucoseService: GlucoseService) {}

  @Post()
  @ApiOperation({ summary: 'Ingestão de medição de glicemia (Manual ou Dispositivo)' })
  @ApiResponse({ status: 201, description: 'Observação registrada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Payload inválido ou fora dos limites plausíveis.' })
  @ApiResponse({ status: 409, description: 'Evento duplicado (Idempotência).' })
  async ingestGlucose(@Req() req: any, @Body() dto: IngestGlucoseDto) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return await this.glucoseService.ingestGlucose(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Histórico de medições de glicemia de um paciente (mais recentes primeiro)' })
  @ApiQuery({ name: 'patientId', required: true, description: 'UUID do paciente' })
  @ApiResponse({ status: 200, description: 'Lista de observações de glicemia.' })
  async history(@Req() req: any, @Query('patientId') patientId: string) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return await this.glucoseService.getPatientHistory(tenantId, patientId);
  }
}
