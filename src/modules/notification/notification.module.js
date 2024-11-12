import fp from 'fastify-plugin';
import { NotificationService } from './notification.service.js';

async function notificationPlugin(fastify) {
  const notificationService = new NotificationService();

  // Add notification-specific decorators
  fastify.decorate('notificationService', notificationService);

  // Add hooks for real-time notifications
  fastify.addHook('preHandler', async (request) => {
    if (request.auth?.user) {
      // Add real-time notification logic here
    }
  });
}

export async function configureNotificationModule(fastify) {
  fastify.register(fp(notificationPlugin));
}