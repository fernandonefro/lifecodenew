import { Controller, Post, Patch, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MedicationsService } from './medications.service';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';

@ApiTags('Medicações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('medications')
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar medicação/insulina em uso' })
  @ApiResponse({ status: 201, description: 'Medicação registrada.' })
  async create(@Req() req: any, @Body() dto: CreateMedicationDto) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.medicationsService.create(tenantId, req.user?.userId, dto);
  }

  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspender uma medicação ativa' })
  @ApiResponse({ status: 200, description: 'Medicação suspensa.' })
  @ApiResponse({ status: 409, description: 'Medicação já suspensa.' })
  async suspend(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.medicationsService.suspend(tenantId, req.user?.userId, id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar medicações de um paciente (ativas por padrão)' })
  @ApiQuery({ name: 'patientId', required: true })
  @ApiQuery({ name: 'active', required: false, description: 'true (padrão) lista só ativas; false lista todas' })
  async list(@Req() req: any, @Query('patientId') patientId: string, @Query('active') active?: string) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    const activeOnly = active !== 'false';
    return this.medicationsService.list(tenantId, patientId, activeOnly);
  }
}
