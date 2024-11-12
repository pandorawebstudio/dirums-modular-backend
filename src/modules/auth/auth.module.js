import fp from 'fastify-plugin';
import { UserModel } from './model.js';
import { RBACService } from './rbac/rbac.service.js';

const rbacService = new RBACService();

async function authPlugin(fastify) {
  fastify.decorate('authenticate', async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) throw new Error('No token provided');

      const decoded = await fastify.jwt.verify(token);
      const user = await UserModel.findById(decoded.userId);
      if (!user) throw new Error('User not found');

      request.auth = { user };
    } catch (err) {
      reply.code(401).send({ error: 'Authentication failed' });
    }
  });

  // Add RBAC middleware
  fastify.decorate('requirePermission', (permission) => {
    return async (request, reply) => {
      try {
        const hasPermission = await rbacService.hasPermission(
          request.auth?.user,
          permission
        );

        if (!hasPermission) {
          reply.code(403).send({ error: 'Insufficient permissions' });
        }
      } catch (error) {
        reply.code(500).send({ error: 'Permission check failed' });
      }
    };
  });
}

export async function configureAuthModule(fastify) {
  fastify.register(fp(authPlugin));
}