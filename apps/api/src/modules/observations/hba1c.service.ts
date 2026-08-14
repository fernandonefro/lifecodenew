import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { ConsentService } from '../../common/audit/consent.service';
import { IngestHba1cDto } from './dto/ingest-hba1c.dto';

// HbA1c (hemoglobina glicada) — LOINC 4548-4, unidade %.
const HBA1C_LOINC = '4548-4';

@Injectable()
export class Hba1cService {
  private readonly logger = new Logger(Hba1cService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly consent: ConsentService,
  ) {}

  /**
   * Registra um exame de HbA1c como ClinicalObservation (LOINC 4548-4).
   * Consentimento LGPD é pré-requisito; a mutação é auditada.
   */
  async ingest(tenantId: string, actorUserId: string, dto: IngestHba1cDto) {
    await this.consent.assertActiveConsent(tenantId, dto.patientId);

    const externalEventId = dto.externalEventId || `hba1c-${crypto.randomUUID()}`;

    const existing = await this.prisma.clinicalObservation
      .findFirst({ where: { tenantId, externalEventId } })
      .catch(() => null);
    if (existing) {
      return { status: 'IDEMPOTENT_SKIPPED', data: existing };
    }

    const observation = await this.prisma.clinicalObservation.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        externalEventId,
        loincCode: HBA1C_LOINC,
        value: dto.valuePercent,
        unit: '%',
        sourceType: 'LABORATORY',
        validationStatus: 'VALIDATED',
        measuredAt: new Date(dto.measuredAt),
        ingestedAt: new Date(),
        metadata: JSON.stringify({ type: 'HBA1C', laboratory: dto.laboratory ?? null }),
      },
    });

    await this.audit.record({
      tenantId,
      userId: actorUserId,
      action: 'INGEST_HBA1C',
      resource: 'clinical_observation',
      newValue: { observationId: observation.id, valuePercent: dto.valuePercent },
    });

    return { status: 'CREATED', data: observation };
  }

  /** Histórico de HbA1c do paciente (mais recentes primeiro), isolado por tenant. */
  async getHistory(tenantId: string, patientId: string, limit = 30) {
    const rows = await this.prisma.clinicalObservation.findMany({
      where: { tenantId, patientId, loincCode: HBA1C_LOINC },
      orderBy: { measuredAt: 'desc' },
      take: limit,
      select: { id: true, value: true, unit: true, measuredAt: true },
    });
    return rows.map((r) => ({ id: r.id, valuePercent: Number(r.value), unit: r.unit, measuredAt: r.measuredAt }));
  }
}
