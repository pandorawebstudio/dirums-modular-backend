import admin from 'firebase-admin';
import { BaseSMSProvider } from './base.provider.js';
import { logger } from '../../../../utils/logger.js';

export class FirebaseProvider extends BaseSMSProvider {
  constructor(config) {
    super(config);
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          JSON.parse(config.credentials.get('serviceAccount'))
        )
      });
    }
    
    this.messaging = admin.messaging();
  }

  async sendSMS(to, content) {
    try {
      const message = {
        notification: {
          body: content
        },
        token: to
      };

      const response = await this.messaging.send(message);

      return {
        success: true,
        messageId: response,
        status: 'sent'
      };
    } catch (error) {
      logger.error(`Firebase SMS error: ${error.message}`);
      throw new Error(`Failed to send SMS via Firebase: ${error.message}`);
    }
  }

  async getStatus(messageId) {
    // Firebase doesn't provide message status tracking
    return {
      status: 'unknown',
      error: null
    };
  }
}