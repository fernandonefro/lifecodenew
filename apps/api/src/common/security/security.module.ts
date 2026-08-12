import { Module, Global } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { TenantGuard } from '../tenant/tenant.guard';
import { TenantInterceptor } from '../tenant/tenant.interceptor';

@Global()
@Module({
  providers: [CryptoService, TenantGuard, TenantInterceptor],
  exports: [CryptoService, TenantGuard, TenantInterceptor],
})
export class SecurityModule {}
