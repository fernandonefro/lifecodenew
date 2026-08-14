import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { ConsentService } from './consent.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  providers: [AuditService, ConsentService, PrismaService],
  exports: [AuditService, ConsentService],
})
export class AuditModule {}
