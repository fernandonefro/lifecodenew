import { IsString, IsNumber, IsOptional, IsUUID, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IngestHba1cDto {
  @ApiProperty({ description: 'UUID do paciente', format: 'uuid' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ description: 'Valor da HbA1c em %', minimum: 3, maximum: 20 })
  @IsNumber()
  @Min(3, { message: 'HbA1c abaixo do limite plausível (mínimo 3%).' })
  @Max(20, { message: 'HbA1c acima do limite plausível (máximo 20%).' })
  valuePercent: number;

  @ApiProperty({ description: 'Data do exame (ISO 8601)' })
  @IsDateString({}, { message: 'Data do exame deve estar no formato ISO 8601.' })
  measuredAt: string;

  @ApiPropertyOptional({ description: 'Laboratório' })
  @IsOptional()
  @IsString()
  laboratory?: string;

  @ApiPropertyOptional({ description: 'ID externo para idempotência (gerado se ausente)' })
  @IsOptional()
  @IsString()
  externalEventId?: string;
}
