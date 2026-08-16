import { Module } from '@nestjs/common';
import { MedicationsController } from './medications.controller';
import { MedicationsService } from './medications.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditModule } from '../../common/audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [MedicationsController],
  providers: [MedicationsService, PrismaService],
  exports: [MedicationsService],
})
export class MedicationsModule {}
