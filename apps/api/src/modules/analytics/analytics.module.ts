import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { OperatorAnalyticsController } from './operator-analytics.controller';
import { OperatorAnalyticsService } from './operator-analytics.service';
import { ClinicalDashboardController } from './clinical-dashboard.controller';
import { ClinicalDashboardService } from './clinical-dashboard.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [AnalyticsController, OperatorAnalyticsController, ClinicalDashboardController],
  providers: [AnalyticsService, OperatorAnalyticsService, ClinicalDashboardService, PrismaService],
  exports: [AnalyticsService, OperatorAnalyticsService, ClinicalDashboardService],
})
export class AnalyticsModule {}
