import fp from 'fastify-plugin';
import { UserService } from './user.service.js';

async function userPlugin(fastify) {
  const userService = new UserService();

  // Add user-specific decorators
  fastify.decorate('userService', userService);

  // Add hooks for user validation
  fastify.addHook('preHandler', async (request) => {
    if (request.body?.user) {
      // Add validation logic here
    }
  });
}

export async function configureUserModule(fastify) {
  fastify.register(fp(userPlugin));
}