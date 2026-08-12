import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly secretKey: Buffer;

  constructor() {
    // Chave de 32 bytes (256 bits) para o algoritmo AES-256-GCM
    const rawSecret = process.env.FIELD_ENCRYPTION_KEY || 'lifecode_aes_256_gcm_secret_key_32bytes!!';
    this.secretKey = crypto.scryptSync(rawSecret, 'lifecode_salt_samd', 32);
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
