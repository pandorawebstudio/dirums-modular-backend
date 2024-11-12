import Fastify from 'fastify';
import mercurius from 'mercurius';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import csrf from '@fastify/csrf-protection';
import swagger from '@fastify/swagger';

import { schema } from './infrastructure/graphql/schema.js';
import { connectDatabase, closeDatabase } from './infrastructure/database/index.js';
import { connectCache, closeCache } from './infrastructure/cache/index.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './utils/error-handler.js';
import { sanitizeInput } from './utils/security.js';
import { swaggerOptions } from './config/swagger.js';
import { configureAuthModule } from './modules/auth/auth.module.js';
import { configureProductModule } from './modules/product/product.module.js';
import { configureOrderModule } from './modules/order/order.module.js';
import { configureCollectionModule } from './modules/collection/collection.module.js';
import { configureMediaModule } from './modules/media/media.module.js';
import { configureUserModule } from './modules/user/user.module.js';
import { configureHealthModule } from './modules/health/health.module.js';

export const app = Fastify({
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

    await app.register(rateLimit, config.rateLimit);
    await app.register(csrf);

    // API documentation
    await app.register(swagger, swaggerOptions);

    // Core plugins
    await app.register(jwt, config.jwt);
    await app.register(multipart);

    // Add input sanitization
    app.addHook('preHandler', sanitizeInput);

    // Configure modules
    await configureAuthModule(app);
    await configureProductModule(app);
    await configureOrderModule(app);
    await configureCollectionModule(app);
    await configureMediaModule(app);
    await configureUserModule(app);
    await configureHealthModule(app);

    // GraphQL
    await app.register(mercurius, {
      schema,
      graphiql: config.isDevelopment,
      path: '/graphql',
      errorHandler
    });

    // Start server
    await app.listen({
      port: config.port,
      host: config.host
    });

    logger.info(`Server listening on ${config.host}:${config.port}`);

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down server...');
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