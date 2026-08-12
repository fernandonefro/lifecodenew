import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Rota sem restrição declarativa de papel
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException('Acesso negado: Perfil de usuário ausente no contexto.');
    }

    // Se o usuário for ADMIN geral do tenant, permite acesso a qualquer rota restrita
    if (user.role === Role.ADMIN) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.role as Role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Acesso negado: O papel '${user.role}' não tem permissão para esta operação. Exigidos: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}
