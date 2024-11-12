import twilio from 'twilio';
import { BaseSMSProvider } from './base.provider.js';
import { logger } from '../../../../utils/logger.js';

export class TwilioProvider extends BaseSMSProvider {
  constructor(config) {
    super(config);
    this.client = twilio(
      config.credentials.get('accountSid'),
      config.credentials.get('authToken')
    );
    this.fromNumber = config.credentials.get('fromNumber');
  }

  async sendSMS(to, content) {
    try {
      const response = await this.client.messages.create({
        body: content,
        from: this.fromNumber,
        to
      });

      return {
        success: true,
        messageId: response.sid,
        status: response.status
      };
    } catch (error) {
      logger.error(`Twilio SMS error: ${error.message}`);
      throw new Error(`Failed to send SMS via Twilio: ${error.message}`);
    }
  }

  async getStatus(messageId) {
    try {
      const message = await this.client.messages(messageId).fetch();
      return {
        status: message.status,
        error: message.errorMessage
      };
    } catch (error) {
      logger.error(`Twilio status check error: ${error.message}`);
      throw new Error(`Failed to check SMS status: ${error.message}`);
    }
  }
}