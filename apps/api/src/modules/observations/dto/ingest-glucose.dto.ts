import { IsString, IsNumber, IsEnum, IsOptional, IsUUID, IsDateString, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
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

  // A plausibilidade fisiológica (10–1000 mg/dL, CA-04) é validada no
  // GlucoseService APÓS a normalização de unidade — um @Min/@Max fixo aqui
  // seria "cego à unidade" e rejeitaria leituras válidas em mmol/L
  // (ex.: 5 mmol/L = 90 mg/dL cairia abaixo de 10).
  @ApiProperty({ description: 'Valor da glicemia (na unidade informada em "unit")' })
  @IsNumber()
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
  @ValidateNested()
  @Type(() => SymptomsReportedDto)
  symptomsReported?: SymptomsReportedDto;

  @ApiPropertyOptional({ description: 'Observações adicionais', maxLength: 500 })
  @IsOptional()
  @IsString()
  notes?: string;
}
