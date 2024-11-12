import fp from 'fastify-plugin';
import { UserModel } from './model.js';

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
}

export async function configureAuthModule(fastify) {
  fastify.register(fp(authPlugin));
}