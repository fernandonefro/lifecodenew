import { InternalServerErrorException } from '@nestjs/common';
import { CryptoService } from './crypto.service';

/**
 * S4 — Padronização em ENCRYPTION_KEY + fail-fast em produção (sem fallback
 * hardcoded). Antes o código lia FIELD_ENCRYPTION_KEY (que o compose de prod
 * não injeta) e caía numa chave AES fixa.
 */
describe('CryptoService (S4)', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('round-trip encrypt/decrypt com ENCRYPTION_KEY definida', () => {
    process.env.ENCRYPTION_KEY = 'chave-de-teste-super-secreta-0123456789';
    const svc = new CryptoService();
    const plain = '529.982.247-25';
    const enc = svc.encrypt(plain);
    expect(enc).not.toBe(plain);
    expect(enc.split(':')).toHaveLength(3); // iv:authTag:data
    expect(svc.decrypt(enc)).toBe(plain);
  });

  it('detecta adulteração (Auth Tag) e lança na descriptografia', () => {
    process.env.ENCRYPTION_KEY = 'chave-de-teste-super-secreta-0123456789';
    const svc = new CryptoService();
    const enc = svc.encrypt('dado');
    const [iv, tag, data] = enc.split(':');
    const adulterado = `${iv}:${tag}:${data.slice(0, -2)}ff`;
    expect(() => svc.decrypt(adulterado)).toThrow(InternalServerErrorException);
  });

  it('em produção, ENCRYPTION_KEY ausente é FATAL', () => {
    delete process.env.ENCRYPTION_KEY;
    process.env.NODE_ENV = 'production';
    expect(() => new CryptoService()).toThrow(InternalServerErrorException);
  });

  it('fora de produção, ausência usa fallback de dev (não lança)', () => {
    delete process.env.ENCRYPTION_KEY;
    process.env.NODE_ENV = 'development';
    expect(() => new CryptoService()).not.toThrow();
  });
});
