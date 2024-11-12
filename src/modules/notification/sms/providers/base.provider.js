export class BaseSMSProvider {
  constructor(config) {
    this.config = config;
  }

  async sendSMS(to, content) {
    throw new Error('sendSMS method must be implemented');
  }

  async getStatus(messageId) {
    throw new Error('getStatus method must be implemented');
  }

  validatePhoneNumber(phoneNumber) {
    // Basic phone number validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  async validateRateLimit() {
    const { maxPerMinute, maxPerHour, maxPerDay } = this.config.rateLimits;
    // Implement rate limiting logic here
    return true;
  }
}