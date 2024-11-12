import Fastify from 'fastify';
import mercurius from 'mercurius';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import csrf from '@fastify/csrf-protection';
import swagger from '@fastify/swagger';

import { schema } from './infrastructure/graphql/index.js';
import { connectDatabase, closeDatabase } from './infrastructure/database/index.js';
import { connectCache, closeCache } from './infrastructure/cache/index.js';
import { config } from './config/index.js';
import { logger } from './domains/shared/utils/logger.js';
import { errorHandler } from './domains/shared/utils/error-handler.js';
import { sanitizeInputs } from './middleware/security.js';
import { swaggerOptions } from './config/swagger.js';

export const app = Fastify({
  logger,
  trustProxy: true
});

async function startServer() {
  try {
    // Connect to databases
    await connectDatabase();
    await connectCache();

    // Security plugins
    await app.register(helmet);
    await app.register(cors, config.cors);
    await app.register(compress);
    await app.register(rateLimit, config.rateLimit);
    await app.register(csrf);

    // API documentation
    await app.register(swagger, swaggerOptions);

    // Core plugins
    await app.register(jwt, config.jwt);
    await app.register(multipart);

    // Add input sanitization
    app.addHook('preHandler', sanitizeInputs);

    // GraphQL
    await app.register(mercurius, {
      schema,
      graphiql: config.isDevelopment,
      path: '/graphql',
      errorHandler
    });

    // Health check
    app.get('/health', () => ({ status: 'ok' }));

    // Start server
    await app.listen({
      port: config.port,
      host: config.host
    });

    // Graceful shutdown
    const shutdown = async () => {
      await app.close();
      await closeDatabase();
      await closeCache();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}