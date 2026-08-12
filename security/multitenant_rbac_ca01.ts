import { Request, Response, NextFunction } from 'express';

export interface UserSessionPayload {
  userId: string;
  tenantId: string;
  role: 'PATIENT' | 'PHYSICIAN' | 'NURSE' | 'CARE_GIVER' | 'ADMIN';
  assignedPatients?: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: UserSessionPayload;
}

export function createTenantRlsMiddleware(dbClient: any) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const user = req.user;

      if (!tenantId || !user) {
        return res.status(401).json({
          errorCode: 'UNAUTHORIZED_TENANT_CONTEXT',
          message: 'Tenant Context (X-Tenant-Id) or User Token is missing.',
        });
      }

      if (tenantId !== user.tenantId) {
        return res.status(403).json({
          errorCode: 'TENANT_MISMATCH_FORBIDDEN',
          message: 'Cross-tenant access attempt detected and blocked.',
        });
      }

      await dbClient.query(`
        SET LOCAL app.current_tenant_id = '${user.tenantId}';
        SET LOCAL app.current_user_id = '${user.userId}';
        SET LOCAL app.current_user_role = '${user.role}';
      `);

      next();
    } catch (error) {
      next(error);
    }
  };
}
