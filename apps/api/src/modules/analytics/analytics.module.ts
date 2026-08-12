import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { OperatorAnalyticsController } from './operator-analytics.controller';
import { OperatorAnalyticsService } from './operator-analytics.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [AnalyticsController, OperatorAnalyticsController],
  providers: [AnalyticsService, OperatorAnalyticsService, PrismaService],
  exports: [AnalyticsService, OperatorAnalyticsService],
})
export class AnalyticsModule {}
