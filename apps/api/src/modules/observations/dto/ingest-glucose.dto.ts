import { IsString, IsNumber, IsEnum, IsOptional, IsUUID, IsDateString, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MeasurementSource, MeasurementContext } from '@lifecode/shared';

export class SymptomsReportedDto {
  @ApiPropertyOptional({ description: 'Confusão mental ou consciência alterada' })
  @IsOptional()
  @IsBoolean()
  confusionOrAlteredConsciousness?: boolean;

  @ApiPropertyOptional({ description: 'Sudorese ou tremores' })
  @IsOptional()
  @IsBoolean()
  sweatingOrTremors?: boolean;

  @ApiPropertyOptional({ description: 'Vômitos ou sinais de cetose' })
  @IsOptional()
  @IsBoolean()
  vomitingOrKetoneSigns?: boolean;
}

export class IngestGlucoseDto {
  @ApiPropertyOptional({ description: 'Versão do schema', default: '1.0' })
  @IsOptional()
  @IsString()
  schemaVersion?: string;

  @ApiProperty({ description: 'UUID do paciente', format: 'uuid' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ description: 'ID externo do evento para idempotência' })
  @IsString()
  externalEventId: string;

  @ApiProperty({ description: 'Valor da glicemia', minimum: 10, maximum: 1000 })
  @IsNumber()
  @Min(10, { message: 'Valor abaixo do limite físico plausível (mínimo 10 mg/dL).' })
  @Max(1000, { message: 'Valor acima do limite físico plausível (máximo 1000 mg/dL).' })
  value: number;

  @ApiProperty({ description: 'Unidade de medida (UCUM)', enum: ['mg/dL', 'mmol/L'], default: 'mg/dL' })
  @IsEnum(['mg/dL', 'mmol/L'], { message: 'Unidade deve ser mg/dL ou mmol/L (padrão UCUM).' })
  unit: 'mg/dL' | 'mmol/L';

  @ApiProperty({ description: 'Origem da medição', enum: MeasurementSource })
  @IsEnum(MeasurementSource, { message: 'Origem da medição é inválida.' })
  sourceType: MeasurementSource;

  @ApiPropertyOptional({ description: 'Contexto da medição', enum: MeasurementContext })
  @IsOptional()
  @IsEnum(MeasurementContext)
  context?: MeasurementContext;

  @ApiPropertyOptional({ description: 'ID do dispositivo' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({ description: 'Data e hora da medição (ISO 8601 UTC)' })
  @IsDateString({}, { message: 'Data e hora da medição devem estar no formato ISO 8601 UTC.' })
  measuredAt: string;

  @ApiPropertyOptional({ description: 'Sintomas relatados pelo paciente', type: SymptomsReportedDto })
  @IsOptional()
  symptomsReported?: SymptomsReportedDto;

  @ApiPropertyOptional({ description: 'Observações adicionais', maxLength: 500 })
  @IsOptional()
  @IsString()
  notes?: string;
}
