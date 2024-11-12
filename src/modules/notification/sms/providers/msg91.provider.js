import axios from 'axios';
import { BaseSMSProvider } from './base.provider.js';
import { logger } from '../../../../utils/logger.js';

export class MSG91Provider extends BaseSMSProvider {
  constructor(config) {
    super(config);
    this.authKey = config.credentials.get('authKey');
    this.senderId = config.credentials.get('senderId');
    this.baseUrl = 'https://api.msg91.com/api/v5';
  }

  async sendSMS(to, content) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/flow/`,
        {
          sender: this.senderId,
          mobiles: to,
          content
        },
        {
          headers: {
            'authkey': this.authKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: response.data.type === 'success',
        messageId: response.data.message_id,
        status: response.data.type
      };
    } catch (error) {
      logger.error(`MSG91 SMS error: ${error.message}`);
      throw new Error(`Failed to send SMS via MSG91: ${error.message}`);
    }
  }

  async getStatus(messageId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/status`,
        {
          params: {
            authkey: this.authKey,
            messageid: messageId
          }
        }
      );

      return {
        status: response.data.status,
        error: response.data.error
      };
    } catch (error) {
      logger.error(`MSG91 status check error: ${error.message}`);
      throw new Error(`Failed to check SMS status: ${error.message}`);
    }
  }
}