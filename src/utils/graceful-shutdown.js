import { logger } from './logger.js';

export function setupGracefulShutdown(fastify) {
  let isShuttingDown = false;

  async function cleanup() {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info('Graceful shutdown initiated');

    try {
      // Stop accepting new requests
      await fastify.close();

      // Close database connections
      await mongoose.connection.close();

      // Close Redis connection
      if (fastify.redis) {
        await fastify.redis.quit();
      }

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  // Handle different termination signals
  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);

  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    cleanup();
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', reason);
    cleanup();
  });
}