import fp from 'fastify-plugin';
import { CollectionService } from './collection.service.js';

async function collectionPlugin(fastify) {
  const collectionService = new CollectionService();

  // Add collection-specific decorators
  fastify.decorate('collectionService', collectionService);

  // Add hooks for collection validation
  fastify.addHook('preHandler', async (request) => {
    if (request.body?.collection) {
      // Add validation logic here
    }
  });
}

export async function configureCollectionModule(fastify) {
  fastify.register(fp(collectionPlugin));
}