import { Module } from '@nestjs/common';
import { GlucoseController } from './glucose.controller';
import { GlucoseService } from './glucose.service';
import { Hba1cController } from './hba1c.controller';
import { Hba1cService } from './hba1c.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditModule } from '../../common/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [GlucoseController, Hba1cController],
  providers: [GlucoseService, Hba1cService, PrismaService],
  exports: [GlucoseService, Hba1cService],
})
export class ObservationsModule {}
