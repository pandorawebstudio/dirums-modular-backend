import { logger } from './logger.js';

export function errorHandler(error, request, reply) {
  logger.error({
    err: error,
    requestId: request.id,
    method: request.method,
    url: request.url,
    params: request.params,
    query: request.query,
    body: request.body
  });

  // Don't expose internal errors to clients
  const response = {
    error: error.name,
    message: config.isDevelopment ? error.message : 'Internal Server Error',
    statusCode: error.statusCode || 500
  };

  if (config.isDevelopment && error.stack) {
    response.stack = error.stack;
  }

  reply.status(response.statusCode).send(response);
}