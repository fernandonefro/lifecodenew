import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';

export interface AuditEntry {
  tenantId: string;
  userId?: string | null;
  action: string;
  resource: string;
  previousValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Trilha de auditoria com integridade via HMAC-SHA256 (mandato CLAUDE.md:
 * toda mutação de dado clínico gera um AuditLog assinado). A assinatura cobre
 * um payload canônico, permitindo detectar adulteração posterior do registro.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  private static resolveKey(): string {
    const key = process.env.AUDIT_HMAC_KEY;
    if (key && key.trim().length > 0) return key;
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUDIT_HMAC_KEY ausente: chave de auditoria obrigatória em produção.');
    }
    return 'dev_only_insecure_audit_hmac_key_change_me';
  }

  static canonical(entry: AuditEntry, timestampIso: string): string {
    return [
      entry.tenantId,
      entry.userId ?? '',
      entry.action,
      entry.resource,
      JSON.stringify(entry.previousValue ?? null),
      JSON.stringify(entry.newValue ?? null),
      timestampIso,
    ].join('|');
  }

  sign(entry: AuditEntry, timestampIso: string): string {
    return crypto
      .createHmac('sha256', AuditService.resolveKey())
      .update(AuditService.canonical(entry, timestampIso))
      .digest('hex');
  }

  /**
   * Grava um registro de auditoria assinado. Best-effort: uma falha de auditoria
   * é logada mas NÃO derruba a operação clínica (bloquear a observação por causa
   * do log seria pior para a segurança do paciente). A falha fica registrada.
   */
  async record(entry: AuditEntry): Promise<void> {
    const timestamp = new Date();
    const hmacSignature = this.sign(entry, timestamp.toISOString());
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: entry.tenantId,
          userId: entry.userId ?? null,
          action: entry.action,
          resource: entry.resource,
          ipAddress: entry.ipAddress ?? 'system',
          userAgent: entry.userAgent ?? 'system',
          previousValue: (entry.previousValue ?? undefined) as any,
          newValue: (entry.newValue ?? undefined) as any,
          hmacSignature,
          timestampUtc: timestamp,
        },
      });
    } catch (e) {
      this.logger.error(`Falha ao gravar AuditLog (${entry.action}/${entry.resource}): ${(e as Error).message}`);
    }
  }
}
