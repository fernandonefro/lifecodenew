import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum RiskTierFilter {
  TIER_1_HIGH = 'TIER_1_HIGH',
  TIER_2_MODERATE = 'TIER_2_MODERATE',
  TIER_3_LOW = 'TIER_3_LOW',
}

export class PopulationRiskFilterDto {
  @IsOptional()
  @IsEnum(RiskTierFilter)
  tier?: RiskTierFilter;

  @IsOptional()
  @IsString()
  periodMonth?: string; // YYYY-MM
}
