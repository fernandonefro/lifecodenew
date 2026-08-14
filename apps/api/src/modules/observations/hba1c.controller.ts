import { Controller, Post, Get, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Hba1cService } from './hba1c.service';
import { IngestHba1cDto } from './dto/ingest-hba1c.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';

@ApiTags('Observações Clínicas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('observations/hba1c')
export class Hba1cController {
  constructor(private readonly hba1cService: Hba1cService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar exame de HbA1c' })
  @ApiResponse({ status: 201, description: 'HbA1c registrada.' })
  @ApiResponse({ status: 403, description: 'Consentimento LGPD ausente.' })
  async ingest(@Req() req: any, @Body() dto: IngestHba1cDto) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.hba1cService.ingest(tenantId, req.user?.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Histórico de HbA1c de um paciente' })
  @ApiQuery({ name: 'patientId', required: true })
  async history(@Req() req: any, @Query('patientId') patientId: string) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.hba1cService.getHistory(tenantId, patientId);
  }
}
