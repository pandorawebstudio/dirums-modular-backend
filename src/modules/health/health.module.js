import fp from 'fastify-plugin';
import mongoose from 'mongoose';

async function healthPlugin(fastify) {
  fastify.get('/health', async (request, reply) => {
    const health = {
      status: 'ok',
      timestamp: new Date(),
      services: {
        database: mongoose.connection.readyState === 1 ? 'up' : 'down',
        redis: fastify.redis ? 'up' : 'down'
      },
      version: process.env.npm_package_version
    };

    const isHealthy = Object.values(health.services)
      .every(status => status === 'up');

    reply.code(isHealthy ? 200 : 503).send(health);
  });
}

export async function configureHealthModule(fastify) {
  fastify.register(fp(healthPlugin));
}