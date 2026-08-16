import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { ConsentService } from '../../common/audit/consent.service';
import { GlucoseIngestionProcessedDTO, AlertSeverity, GLUCOSE_LOINC_CODE } from '@lifecode/shared';
import { isGlucoseShadowEnabled } from '../../config/feature-flags';
import { evaluateGlucoseInShadow } from './glucose-shadow';

@Injectable()
export class GlucoseService {
  private readonly logger = new Logger(GlucoseService.name);

  /** Fator de conversão UCUM mmol/L → mg/dL para glicose (mesmo do schema Zod). */
  private static readonly MMOL_L_TO_MG_DL = 18.0182;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly consent: ConsentService,
  ) {}

  async ingestGlucose(tenantId: string, dto: GlucoseIngestionProcessedDTO) {
    // 0. Normaliza a unidade para mg/dL — o motor de regras e a persistência
    //    operam SEMPRE em mg/dL. (Sem isto, uma leitura em mmol/L chegava crua
    //    ao motor e gerava classificação de severidade errada.)
    const reading = this.normalizeToMgDl(dto);

    // 0b. Plausibilidade fisiológica (CA-04), já sobre o valor em mg/dL.
    this.assertPhysiologicallyPlausible(reading.value);

    // 0c. Consentimento LGPD/TCLE é pré-requisito da ingestão (bloqueia com 403).
    const patientUserId = await this.consent.assertActiveConsent(tenantId, reading.patientId);

    // 1. Verificação de Idempotência (CA-02)
    const existingObservation = await this.prisma.clinicalObservation.findFirst({
      where: {
        tenantId,
        externalEventId: reading.externalEventId,
      },
    }).catch(() => null);

    if (existingObservation) {
      this.logger.warn(`Ingestão duplicada ignorada (Idempotência): ${reading.externalEventId}`);
      return { status: 'IDEMPOTENT_SKIPPED', data: existingObservation, alertTriggered: null };
    }

    // 2. Transação: Salva a Observação e Avalia Regras do Motor Clínico
    const result = await this.prisma.$transaction(async (tx) => {
      // Grava a Observação Canônica (valor canônico em mg/dL)
      const observation = await tx.clinicalObservation.create({
        data: {
          tenantId,
          patientId: reading.patientId,
          externalEventId: reading.externalEventId,
          loincCode: GLUCOSE_LOINC_CODE,
          value: reading.value,
          unit: reading.unit,
          sourceType: reading.sourceType as any,
          context: reading.context,
          deviceId: reading.deviceId,
          measuredAt: new Date(reading.measuredAt),
          ingestedAt: new Date(),
          validationStatus: 'VALIDATED',
          metadata: JSON.stringify({
            symptoms: reading.symptomsReported,
            notes: reading.notes,
            originalValue: reading.originalValue,
            originalUnit: reading.originalUnit,
          }),
        },
      });

      // 3. Motor de Regras Rápidas: Avaliação de Severidade (P0/P1)
      const alertSeverity = this.evaluateGlucoseAlertRules(reading);

      if (alertSeverity) {
        await tx.alert.create({
          data: {
            tenantId,
            patientId: dto.patientId,
            observationId: observation.id,
            severity: alertSeverity,
            status: 'OPEN',
            title: `Alerta Clínico ${alertSeverity}: Glicemia ${reading.value} mg/dL`,
            message: this.buildAlertMessage(reading, alertSeverity),
            dueDate: this.calculateSlaDueDate(alertSeverity),
          },
        });

        this.logger.warn(`Alerta ${alertSeverity} gerado para o Paciente ${reading.patientId}`);
      }

      return { status: 'CREATED', data: observation, alertTriggered: alertSeverity };
    });

    // 4. Auditoria assinada (HMAC) da mutação clínica (mandato CLAUDE.md).
    await this.audit.record({
      tenantId,
      userId: patientUserId,
      action: 'INGEST_GLUCOSE',
      resource: 'clinical_observation',
      newValue: {
        observationId: result.data.id,
        value: reading.value,
        unit: reading.unit,
        alertTriggered: result.alertTriggered ?? null,
      },
    });

    // 5. Motor de regras candidatas em modo SHADOW (ADR-0002) — OBSERVACIONAL.
    //    Desligado por padrão; quando ligado, apenas registra a avaliação de forma
    //    desidentificada (sem valores/PII) e NUNCA cria alerta/tarefa/mensagem.
    //    Best-effort: qualquer falha aqui é ignorada e não afeta a ingestão nem o alerta legado.
    if (isGlucoseShadowEnabled()) {
      try {
        const outcomes = evaluateGlucoseInShadow({
          glucoseMgDl: reading.value,
          sensorValid: true,
          confusion: reading.symptomsReported?.confusionOrAlteredConsciousness,
          persistentVomiting: reading.symptomsReported?.vomitingOrKetoneSigns,
        });
        const emitted = outcomes.filter((o) => o.emit).length;
        this.logger.debug(
          `[SHADOW] regras avaliadas=${outcomes.length} emit=${emitted} (esperado 0)`,
        );
      } catch {
        this.logger.warn('[SHADOW] avaliação candidata falhou — ignorada (sem efeito no fluxo)');
      }
    }

    return result;
  }

  /**
   * Histórico de glicemias de um paciente (mais recentes primeiro).
   * Sempre isolado por tenant (CA-01).
   */
  async getPatientHistory(tenantId: string, patientId: string, limit = 30) {
    const rows = await this.prisma.clinicalObservation.findMany({
      where: { tenantId, patientId },
      orderBy: { measuredAt: 'desc' },
      take: limit,
      select: {
        id: true,
        value: true,
        unit: true,
        measuredAt: true,
        context: true,
        sourceType: true,
      },
    });
    return rows.map((r) => ({ ...r, value: Number(r.value) }));
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

  /**
   * Normaliza a leitura para mg/dL (unidade canônica do motor de regras).
   * Preserva o valor/unidade originais para rastreabilidade.
   */
  private normalizeToMgDl(
    dto: GlucoseIngestionProcessedDTO,
  ): GlucoseIngestionProcessedDTO & { originalValue: number; originalUnit: string } {
    if (dto.unit === 'mmol/L') {
      return {
        ...dto,
        value: Math.round(dto.value * GlucoseService.MMOL_L_TO_MG_DL),
        unit: 'mg/dL',
        originalValue: dto.value,
        originalUnit: 'mmol/L',
      };
    }
    return { ...dto, originalValue: dto.value, originalUnit: dto.unit };
  }

  /**
   * Barreira de plausibilidade fisiológica (CA-04), avaliada em mg/dL.
   * Substitui os limites @Min/@Max do DTO, que eram cegos à unidade.
   */
  private assertPhysiologicallyPlausible(valueMgDl: number): void {
    if (!Number.isFinite(valueMgDl) || valueMgDl < 10 || valueMgDl > 1000) {
      throw new BadRequestException(
        'Valor de glicemia fora do limite físico plausível (10–1000 mg/dL).',
      );
    }
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
