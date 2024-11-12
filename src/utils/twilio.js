import twilio from 'twilio';
import { config } from '../config/index.js';
import { logger } from './logger.js';

const client = twilio(config.twilio.accountSid, config.twilio.authToken);

export async function sendOTP(phoneNumber) {
  try {
    await client.verify.v2
      .services(config.twilio.verifyServiceSid)
      .verifications.create({
        to: phoneNumber,
        channel: 'sms'
      });
    
    logger.info(`OTP sent to ${phoneNumber}`);
    return true;
  } catch (error) {
    logger.error(`Error sending OTP: ${error.message}`);
    throw new Error('Failed to send OTP');
  }
}

export async function verifyOTP(phoneNumber, code) {
  try {
    const verification = await client.verify.v2
      .services(config.twilio.verifyServiceSid)
      .verificationChecks.create({
        to: phoneNumber,
        code
      });

    logger.info(`OTP verification result for ${phoneNumber}: ${verification.status}`);
    return verification.status === 'approved';
  } catch (error) {
    logger.error(`Error verifying OTP: ${error.message}`);
    throw new Error('Failed to verify OTP');
  }
}