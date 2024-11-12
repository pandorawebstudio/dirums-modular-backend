import { NotificationModel } from './model.js';
import { SMSService } from './sms/sms.service.js';
import { EmailService } from './email/email.service.js';
import { UserModel } from '../user/model.js';
import { logger } from '../../utils/logger.js';

export class NotificationService {
  constructor() {
    this.smsService = new SMSService();
    this.emailService = new EmailService();
  }

  async notify(userId, notification) {
    try {
      const notif = new NotificationModel({
        recipient: userId,
        ...notification,
        status: 'PENDING'
      });

      await notif.save();

      // Send notifications based on type
      switch (notification.type) {
        case 'EMAIL':
          await this.emailService.sendEmail(
            notification.recipient,
            notification.title,
            notification.content
          );
          break;

        case 'SMS':
          await this.smsService.sendSMS(
            notification.recipient,
            notification.content
          );
          break;

        case 'SYSTEM':
          // System notifications are just stored in DB
          break;
      }

      notif.status = 'SENT';
      await notif.save();

      return notif;
    } catch (error) {
      logger.error(`Notification error: ${error.message}`);
      throw error;
    }
  }

  async notifyAdmins(notification) {
    try {
      const admins = await UserModel.find({ role: 'ADMIN' });
      
      const notifications = await Promise.all(
        admins.map(admin => this.notify(admin._id, notification))
      );

      return notifications;
    } catch (error) {
      logger.error(`Admin notification error: ${error.message}`);
      throw error;
    }
  }

  async getUserNotifications(userId, { status, limit = 20, offset = 0 }) {
    try {
      const query = { recipient: userId };
      if (status) query.status = status;

      return NotificationModel.find(query)
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.error(`Get notifications error: ${error.message}`);
      throw error;
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      const notification = await NotificationModel.findOne({
        _id: notificationId,
        recipient: userId
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      notification.readAt = new Date();
      return notification.save();
    } catch (error) {
      logger.error(`Mark as read error: ${error.message}`);
      throw error;
    }
  }

  async markAllAsRead(userId) {
    try {
      await NotificationModel.updateMany(
        {
          recipient: userId,
          readAt: null
        },
        {
          readAt: new Date()
        }
      );

      return true;
    } catch (error) {
      logger.error(`Mark all as read error: ${error.message}`);
      throw error;
    }
  }

  async deleteNotification(notificationId, userId) {
    try {
      const notification = await NotificationModel.findOne({
        _id: notificationId,
        recipient: userId
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.remove();
      return true;
    } catch (error) {
      logger.error(`Delete notification error: ${error.message}`);
      throw error;
    }
  }
}