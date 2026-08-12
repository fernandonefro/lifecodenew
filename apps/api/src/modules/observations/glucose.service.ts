import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GlucoseIngestionProcessedDTO, AlertSeverity, GLUCOSE_LOINC_CODE } from '@lifecode/shared';

@Injectable()
export class GlucoseService {
  private readonly logger = new Logger(GlucoseService.name);

  constructor(private readonly prisma: PrismaService) {}

  async ingestGlucose(tenantId: string, dto: GlucoseIngestionProcessedDTO) {
    const prismaAny = this.prisma as any;

    // 1. Verificação de Idempotência (CA-02)
    const existingObservation = await prismaAny.clinicalObservation.findFirst({
      where: {
        tenantId,
        externalEventId: dto.externalEventId,
      },
    }).catch(() => null);

    if (existingObservation) {
      this.logger.warn(`Ingestão duplicada ignorada (Idempotência): ${dto.externalEventId}`);
      return { status: 'IDEMPOTENT_SKIPPED', data: existingObservation };
    }

    // 2. Transação: Salva a Observação e Avalia Regras do Motor Clínico
    return await prismaAny.$transaction(async (tx: any) => {
      // Grava a Observação Canônica
      const observation = await tx.clinicalObservation.create({
        data: {
          tenantId,
          patientId: dto.patientId,
          externalEventId: dto.externalEventId,
          loincCode: GLUCOSE_LOINC_CODE,
          value: dto.value,
          unit: dto.unit,
          sourceType: dto.sourceType as any,
          context: dto.context,
          deviceId: dto.deviceId,
          measuredAt: new Date(dto.measuredAt),
          ingestedAt: new Date(),
          validationStatus: 'VALIDATED',
          metadata: JSON.stringify({
            symptoms: dto.symptomsReported,
            notes: dto.notes,
          }),
        },
      });

      // 3. Motor de Regras Rápidas: Avaliação de Severidade (P0/P1)
      const alertSeverity = this.evaluateGlucoseAlertRules(dto);

      if (alertSeverity) {
        await tx.alert.create({
          data: {
            tenantId,
            patientId: dto.patientId,
            observationId: observation.id,
            severity: alertSeverity,
            status: 'OPEN',
            title: `Alerta Clínico ${alertSeverity}: Glicemia ${dto.value} mg/dL`,
            message: this.buildAlertMessage(dto, alertSeverity),
            dueDate: this.calculateSlaDueDate(alertSeverity),
          },
        });

        this.logger.warn(`Alerta ${alertSeverity} gerado para o Paciente ${dto.patientId}`);
      }

      return { status: 'CREATED', data: observation, alertTriggered: alertSeverity };
    });
  }

  /**
   * Motor de Regras Clínicas Simplificado para Glicose
   */
  private evaluateGlucoseAlertRules(dto: GlucoseIngestionProcessedDTO): AlertSeverity | null {
    const { value, symptomsReported } = dto;

    if (
      value < 54 || 
      (value > 300 && symptomsReported?.vomitingOrKetoneSigns) ||
      symptomsReported?.confusionOrAlteredConsciousness
    ) {
      return AlertSeverity.P0_EMERGENCY;
    }

    if (value >= 54 && value < 70) {
      return AlertSeverity.P1_HIGH_RISK;
    }

    if (value > 250) {
      return AlertSeverity.P1_HIGH_RISK;
    }

    return null;
  }

  private buildAlertMessage(dto: GlucoseIngestionProcessedDTO, severity: AlertSeverity): string {
    if (severity === AlertSeverity.P0_EMERGENCY) {
      return `Valor crítico detectado (${dto.value} mg/dL). Orientação de emergência disparada ao paciente. Ação imediata necessária.`;
    }
    return `Alteração glicêmica expressiva (${dto.value} mg/dL). Revisar plano individualizado e contatar paciente no SLA estipulado.`;
  }

  private calculateSlaDueDate(severity: AlertSeverity): Date {
    const now = new Date();
    if (severity === AlertSeverity.P0_EMERGENCY) {
      return now;
    }
    now.setHours(now.getHours() + 4);
    return now;
  }
}
