import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditModule } from '../../common/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AlertsController],
  providers: [AlertsService, PrismaService],
  exports: [AlertsService],
})
export class AlertsModule {}
