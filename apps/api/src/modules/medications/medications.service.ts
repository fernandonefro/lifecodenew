import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { CreateMedicationDto, MedicationRoute } from './dto/create-medication.dto';

@Injectable()
export class MedicationsService {
  private readonly logger = new Logger(MedicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(tenantId: string, actorUserId: string, dto: CreateMedicationDto) {
    // Garante que o paciente pertence ao tenant (isolamento CA-01).
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, tenantId },
      select: { id: true },
    });
    if (!patient) throw new NotFoundException('Paciente não encontrado no tenant informado.');

    const medication = await this.prisma.medication.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        name: dto.name,
        drugClass: dto.drugClass,
        dose: dto.dose,
        frequency: dto.frequency,
        route: dto.route ?? MedicationRoute.ORAL,
        startDate: new Date(dto.startDate),
        notes: dto.notes,
      },
    });

    await this.audit.record({
      tenantId,
      userId: actorUserId,
      action: 'CREATE_MEDICATION',
      resource: 'medication',
      newValue: { medicationId: medication.id, name: medication.name },
    });

    return { status: 'CREATED', data: medication };
  }

  /** Suspende uma medicação ativa (active=true -> false, endDate=agora), atômico. */
  async suspend(tenantId: string, actorUserId: string, medicationId: string) {
    const result = await this.prisma.medication.updateMany({
      where: { id: medicationId, tenantId, active: true },
      data: { active: false, endDate: new Date() },
    });

    if (result.count === 0) {
      const existing = await this.prisma.medication.findFirst({ where: { id: medicationId, tenantId } });
      if (!existing) throw new NotFoundException('Medicação não encontrada.');
      throw new ConflictException('Medicação já está suspensa.');
    }

    await this.audit.record({
      tenantId,
      userId: actorUserId,
      action: 'SUSPEND_MEDICATION',
      resource: 'medication',
      newValue: { medicationId },
    });

    return { status: 'OK', data: await this.prisma.medication.findUnique({ where: { id: medicationId } }) };
  }

  /** Lista medicações do paciente (ativas por padrão), isolada por tenant. */
  async list(tenantId: string, patientId: string, activeOnly = true) {
    return this.prisma.medication.findMany({
      where: { tenantId, patientId, ...(activeOnly ? { active: true } : {}) },
      orderBy: { startDate: 'desc' },
    });
  }
}
