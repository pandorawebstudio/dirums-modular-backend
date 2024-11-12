import fp from 'fastify-plugin';
import { MediaService } from './media.service.js';

async function mediaPlugin(fastify) {
  const mediaService = new MediaService();

  // Add media-specific decorators
  fastify.decorate('mediaService', mediaService);

  // Add hooks for media validation
  fastify.addHook('preHandler', async (request) => {
    if (request.isMultipart()) {
      // Add file validation logic here
    }
  });
}

export async function configureMediaModule(fastify) {
  fastify.register(fp(mediaPlugin));
}