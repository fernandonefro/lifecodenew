import { Module } from '@nestjs/common';
import { GlucoseController } from './glucose.controller';
import { GlucoseService } from './glucose.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditModule } from '../../common/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [GlucoseController],
  providers: [GlucoseService, PrismaService],
  exports: [GlucoseService],
})
export class ObservationsModule {}
