import fp from 'fastify-plugin';
import { ProductService } from './product.service.js';

async function productPlugin(fastify) {
  const productService = new ProductService();

  // Add product-specific decorators
  fastify.decorate('productService', productService);

  // Add hooks for product validation
  fastify.addHook('preHandler', async (request) => {
    if (request.body?.product) {
      // Add validation logic here
    }
  });
}

export async function configureProductModule(fastify) {
  fastify.register(fp(productPlugin));
}