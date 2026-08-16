import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Verificação de consentimento LGPD/TCLE. Pré-requisito para qualquer ingestão
 * de dado clínico (mandato CLAUDE.md): sem consentimento ativo, a ingestão é
 * bloqueada (403).
 */
@Injectable()
export class ConsentService {
  // Escopos obrigatórios antes de ingerir dado clínico.
  private static readonly REQUIRED_SCOPES = ['TCLE_TERMS_OF_SERVICE', 'PRIVACY_POLICY_LGPD'];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Garante que o paciente possui consentimento ativo (aceito e não revogado)
   * para todos os escopos obrigatórios. Retorna o userId do paciente (útil para
   * atribuir autoria na auditoria).
   */
  async assertActiveConsent(tenantId: string, patientId: string): Promise<string> {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
      select: { userId: true },
    });
    if (!patient) {
      throw new ForbiddenException('Paciente não encontrado no tenant informado.');
    }

    const consents = await this.prisma.consentLog.findMany({
      where: {
        userId: patient.userId,
        accepted: true,
        revokedAtUtc: null,
        scope: { in: ConsentService.REQUIRED_SCOPES as any },
      },
      select: { scope: true },
    });

    const granted = new Set(consents.map((c) => c.scope as unknown as string));
    const missing = ConsentService.REQUIRED_SCOPES.filter((s) => !granted.has(s));
    if (missing.length > 0) {
      throw new ForbiddenException(
        `Consentimento LGPD/TCLE ausente (${missing.join(', ')}). Ingestão de dado clínico bloqueada.`,
      );
    }

    return patient.userId;
  }
}
