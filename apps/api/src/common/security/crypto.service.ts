import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly secretKey: Buffer;

  constructor() {
    // Deriva a chave de 32 bytes (256 bits) para AES-256-GCM a partir do segredo.
    this.secretKey = crypto.scryptSync(CryptoService.resolveSecret(), 'lifecode_salt_samd', 32);
  }

  /**
   * Resolve o segredo de criptografia a partir de ENCRYPTION_KEY (nome único,
   * alinhado ao docker-compose e ao .env). Em produção, a ausência é FATAL —
   * nunca cair numa chave hardcoded. Fora de produção, usa um valor de dev
   * explícito e avisa (sem jamais logar o valor da chave).
   */
  private static resolveSecret(): string {
    const key = process.env.ENCRYPTION_KEY;
    if (key && key.trim().length > 0) return key;

    if (process.env.NODE_ENV === 'production') {
      throw new InternalServerErrorException(
        'ENCRYPTION_KEY ausente: defina a chave AES-256 (32 bytes) em produção.',
      );
    }

    new Logger(CryptoService.name).warn(
      'ENCRYPTION_KEY não definida — usando chave de DESENVOLVIMENTO. NUNCA use em produção.',
    );
    return 'dev_only_insecure_encryption_key_change_me';
  }

  /**
   * Criptografa um texto sensível (ex: CPF) usando AES-256-GCM com IV aleatório e Auth Tag.
   * Retorna o formato string: `iv:authTag:encryptedData`
   */
  encrypt(text: string): string {
    if (!text) return text;
    try {
      const iv = crypto.randomBytes(12); // IV recomendado de 12 bytes para GCM
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag().toString('hex');

      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
      throw new InternalServerErrorException('Falha na criptografia do dado sensível (AES-256-GCM).');
    }
  }

  /**
   * Descriptografa a string cifrada e verifica a integridade da Auth Tag.
   */
  decrypt(cipherText: string): string {
    if (!cipherText || !cipherText.includes(':')) return cipherText;
    try {
      const parts = cipherText.split(':');
      if (parts.length !== 3) return cipherText;

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encryptedData = parts[2];

      const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new InternalServerErrorException('Falha na descriptografia ou falha de autenticidade (Auth Tag violada).');
    }
  }
}
