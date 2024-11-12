import fp from 'fastify-plugin';

async function orderPlugin(fastify) {
  // Add order-specific hooks or decorators
  fastify.addHook('preHandler', async (request) => {
    if (request.body?.order) {
      // Add any order validation or transformation logic
    }
  });

  // Add order-specific rate limiting
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