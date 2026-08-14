import { Module } from '@nestjs/common';
import { SecurityModule } from './common/security/security.module';
import { AuthModule } from './auth/auth.module';
import { ObservationsModule } from './modules/observations/observations.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [SecurityModule, AuthModule, ObservationsModule, AlertsModule, AnalyticsModule, HealthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
