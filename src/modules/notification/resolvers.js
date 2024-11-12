import { NotificationService } from './notification.service.js';
import { logger } from '../../utils/logger.js';

const notificationService = new NotificationService();

export const notificationResolvers = {
  Query: {
    notifications: async (_, { status, limit, offset }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      return notificationService.getUserNotifications(
        auth.user.id,
        { status, limit, offset }
      );
    },

    unreadNotificationsCount: async (_, __, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      return NotificationModel.countDocuments({
        recipient: auth.user.id,
        readAt: null
      });
    }
  },

  Mutation: {
    markNotificationAsRead: async (_, { id }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      return notificationService.markAsRead(id, auth.user.id);
    },

    markAllNotificationsAsRead: async (_, __, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      return notificationService.markAllAsRead(auth.user.id);
    },

    deleteNotification: async (_, { id }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      return notificationService.deleteNotification(id, auth.user.id);
    }
  },

  Notification: {
    recipient: async (notification, _, { dataSources }) => {
      return dataSources.users.findById(notification.recipient);
    }
  }
};