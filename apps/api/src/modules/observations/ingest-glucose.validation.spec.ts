import 'reflect-metadata';
import { ValidationPipe, BadRequestException, ArgumentMetadata } from '@nestjs/common';
import { IngestGlucoseDto } from './dto/ingest-glucose.dto';
import { MeasurementSource } from '@lifecode/shared';

/**
 * S2 — Antes, os decorators class-validator do DTO eram inertes (o único pipe
 * global era o ZodValidationPipe, que só age sobre createZodDto). Com o
 * ValidationPipe nativo, payloads inválidos passam a ser rejeitados (HTTP 400).
 */
describe('IngestGlucoseDto - ValidationPipe (S2)', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: false });
  const meta: ArgumentMetadata = { type: 'body', metatype: IngestGlucoseDto, data: '' };

  const valid = () => ({
    patientId: '123e4567-e89b-12d3-a456-426614174000',
    externalEventId: 'evt-ok',
    value: 120,
    unit: 'mg/dL',
    sourceType: MeasurementSource.MANUAL,
    measuredAt: '2026-08-13T10:00:00.000Z',
  });

  it('aceita um payload válido e retorna instância do DTO', async () => {
    const out = await pipe.transform(valid(), meta);
    expect(out).toBeInstanceOf(IngestGlucoseDto);
  });

  it('rejeita patientId não-UUID (400)', async () => {
    await expect(pipe.transform({ ...valid(), patientId: 'nao-e-uuid' }, meta)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejeita unit fora do enum UCUM (400)', async () => {
    await expect(pipe.transform({ ...valid(), unit: 'g/L' }, meta)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejeita value não-numérico (400)', async () => {
    await expect(pipe.transform({ ...valid(), value: 'alto' }, meta)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejeita campo obrigatório ausente - measuredAt (400)', async () => {
    const { measuredAt, ...semData } = valid();
    await expect(pipe.transform(semData, meta)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejeita sourceType inválido no enum (400)', async () => {
    await expect(pipe.transform({ ...valid(), sourceType: 'CHUTE' }, meta)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
