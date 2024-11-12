import { SMSService } from './sms.service.js';
import { logger } from '../../../utils/logger.js';

export class VerificationService {
  constructor() {
    this.smsService = new SMSService();
    this.verificationStore = new Map(); // In production, use Redis or similar
  }

  async sendOTP(phoneNumber, options = {}) {
    try {
      const otp = this.generateOTP(options.length || 6);
      const expiresIn = options.expiresIn || 10 * 60 * 1000; // 10 minutes default

      // Store OTP with expiration
      this.verificationStore.set(phoneNumber, {
        otp,
        expiresAt: Date.now() + expiresIn,
        attempts: 0
      });

      // Send OTP using configured SMS provider
      await this.smsService.sendSMS(
        phoneNumber,
        'VERIFICATION_OTP',
        { otp },
        options.preferredProvider
      );

      return true;
    } catch (error) {
      logger.error(`Send OTP error: ${error.message}`);
      throw new Error('Failed to send OTP');
    }
  }

  async verifyOTP(phoneNumber, code) {
    try {
      const verification = this.verificationStore.get(phoneNumber);
      if (!verification) {
        throw new Error('No verification found');
      }

      // Check expiration
      if (Date.now() > verification.expiresAt) {
        this.verificationStore.delete(phoneNumber);
        throw new Error('OTP expired');
      }

      // Check attempts
      if (verification.attempts >= 3) {
        this.verificationStore.delete(phoneNumber);
        throw new Error('Too many attempts');
      }

      // Verify OTP
      const isValid = verification.otp === code;
      verification.attempts++;

      if (!isValid) {
        if (verification.attempts >= 3) {
          this.verificationStore.delete(phoneNumber);
        }
        throw new Error('Invalid OTP');
      }

      // Cleanup on success
      this.verificationStore.delete(phoneNumber);
      return true;
    } catch (error) {
      logger.error(`Verify OTP error: ${error.message}`);
      throw error;
    }
  }

  generateOTP(length) {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    
    return otp;
  }
}