import { IsString, IsOptional, IsUUID, IsDateString, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MedicationRoute {
  ORAL = 'oral',
  SUBCUTANEA = 'subcutanea',
}

export class CreateMedicationDto {
  @ApiProperty({ description: 'UUID do paciente', format: 'uuid' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ description: 'Nome do medicamento', example: 'Metformina' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Classe farmacológica', example: 'biguanida' })
  @IsOptional()
  @IsString()
  drugClass?: string;

  @ApiPropertyOptional({ description: 'Dose', example: '850mg' })
  @IsOptional()
  @IsString()
  dose?: string;

  @ApiPropertyOptional({ description: 'Frequência', example: '2x/dia' })
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional({ description: 'Via de administração', enum: MedicationRoute, default: MedicationRoute.ORAL })
  @IsOptional()
  @IsEnum(MedicationRoute, { message: 'Via deve ser oral ou subcutanea.' })
  route?: MedicationRoute;

  @ApiProperty({ description: 'Data de início (ISO 8601)' })
  @IsDateString({}, { message: 'Data de início deve estar no formato ISO 8601.' })
  startDate: string;

  @ApiPropertyOptional({ description: 'Observação', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
