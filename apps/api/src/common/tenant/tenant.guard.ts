import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headerTenantId = request.headers['x-tenant-id'];
    const user = request.user;

    // Se for uma rota pública que não exige auth, permite passar
    if (!user && !headerTenantId) {
      return true;
    }

    // Se o usuário está autenticado, valida se o Tenant do Header coincide com o JWT Token
    if (user && headerTenantId && user.tenantId !== headerTenantId) {
      throw new ForbiddenException(
        'Acesso negado: O Tenant informado no cabeçalho X-Tenant-Id diverge do token autenticado.'
      );
    }

    const tenantId = user?.tenantId || headerTenantId;

    if (!tenantId) {
      throw new UnauthorizedException('Cabeçalho obrigatório X-Tenant-Id não fornecido.');
    }

    // Armazena o tenantId validado no request context
    request.tenantId = tenantId;

    return true;
  }
}
