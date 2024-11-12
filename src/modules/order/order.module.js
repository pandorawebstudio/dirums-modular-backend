import fp from 'fastify-plugin';
import { OrderService } from './order.service.js';

async function orderPlugin(fastify) {
  const orderService = new OrderService();

  // Add order-specific decorators
  fastify.decorate('orderService', orderService);

  // Add rate limiting for orders
  fastify.register(async (instance) => {
    instance.addHook('preHandler', async (request, reply) => {
      const key = `order:${request.auth?.user?.id}`;
      const count = await fastify.redis.incr(key);
      
      if (count === 1) {
        await fastify.redis.expire(key, 3600); // 1 hour window
      }
      
      if (count > 100) { // 100 orders per hour limit
        reply.code(429).send({ error: 'Too many orders' });
      }
    });
  }, { prefix: '/orders' });
}

export async function configureOrderModule(fastify) {
  fastify.register(fp(orderPlugin));
}