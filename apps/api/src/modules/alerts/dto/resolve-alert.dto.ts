import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AlertDisposition {
  PATIENT_CONTACTED_STABLE = 'PATIENT_CONTACTED_STABLE',
  EMERGENCY_SERVICES_DISPATCHED = 'EMERGENCY_SERVICES_DISPATCHED',
  ESCALATED_TO_PHYSICIAN = 'ESCALATED_TO_PHYSICIAN',
  FALSE_ALARM = 'FALSE_ALARM',
  OTHER = 'OTHER',
}

export class ResolveAlertDto {
  @ApiProperty({ description: 'Conduta clínica registrada no fechamento', enum: AlertDisposition })
  @IsEnum(AlertDisposition, { message: 'Conduta (disposition) inválida.' })
  disposition: AlertDisposition;

  @ApiPropertyOptional({ description: 'Notas da conduta clínica', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
