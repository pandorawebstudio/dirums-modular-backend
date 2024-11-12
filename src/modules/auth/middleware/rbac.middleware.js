import { RBACService } from '../rbac/rbac.service.js';

const rbacService = new RBACService();

export function requirePermission(permission) {
  return async (request, reply) => {
    try {
      const hasPermission = await rbacService.hasPermission(
        request.auth?.user,
        permission
      );

      if (!hasPermission) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Insufficient permissions'
        });
        return;
      }
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error checking permissions'
      });
    }
  };
}

export function requireRole(role) {
  return async (request, reply) => {
    try {
      const userRole = request.auth?.user?.role;
      if (!userRole) {
        reply.code(401).send({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
        return;
      }

      const roleDoc = await rbacService.getRoleFromCache(userRole);
      if (!roleDoc) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Invalid role'
        });
        return;
      }

      const hasRole = userRole === role || await roleDoc.inheritsFrom(role);
      if (!hasRole) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Insufficient role'
        });
        return;
      }
    } catch (error) {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Error checking role'
      });
    }
  };
}