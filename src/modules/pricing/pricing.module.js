import fp from 'fastify-plugin';
import { PricingService } from './pricing.service.js';

async function pricingPlugin(fastify) {
  const pricingService = new PricingService();

  // Add pricing-specific decorators
  fastify.decorate('pricingService', pricingService);

  // Add hooks for price conversion
  fastify.addHook('preHandler', async (request) => {
    if (request.body?.currency) {
      // Add currency conversion logic here
    }
  });
}

export async function configurePricingModule(fastify) {
  fastify.register(fp(pricingPlugin));
}