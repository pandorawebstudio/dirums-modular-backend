import fp from 'fastify-plugin';
import mongoose from 'mongoose';
import { config } from '../../config/index.js';

async function productPlugin(fastify) {
  // Connect to MongoDB if not already connected
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.mongodb.uri);
  }

  // Add any product-specific hooks or decorators here
  fastify.addHook('preHandler', async (request) => {
    if (request.body?.product) {
      // Add any product validation or transformation logic
    }
  });
}

export async function configureProductModule(fastify) {
  fastify.register(fp(productPlugin));
}