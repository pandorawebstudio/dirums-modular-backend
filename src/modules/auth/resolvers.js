import mercurius from 'mercurius';
import { VerificationService } from '../notification/sms/verification.service.js';
import { generateToken } from '../../utils/auth.js';
import { UserModel } from './model.js';
import { logger } from '../../utils/logger.js';

const verificationService = new VerificationService();
const AuthenticationError = (message) => new mercurius.ErrorWithProps(message, { code: 'UNAUTHORIZED' });

export const authResolvers = {
  Query: {
    me: async (_, __, { auth }) => {
      if (!auth.user) throw new AuthenticationError('Not authenticated');
      return auth.user;
    }
  },

  Mutation: {
    requestPhoneOTP: async (_, { phoneNumber, provider }) => {
      try {
        // Validate phone number format
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(phoneNumber)) {
          throw new Error('Invalid phone number format. Use E.164 format (e.g., +1234567890)');
        }

        await verificationService.sendOTP(phoneNumber, {
          preferredProvider: provider
        });
        return true;
      } catch (error) {
        logger.error(`Request OTP error: ${error.message}`);
        throw new Error(`Failed to send OTP: ${error.message}`);
      }
    },

    verifyPhoneOTP: async (_, { phoneNumber, otp }) => {
      try {
        const isValid = await verificationService.verifyOTP(phoneNumber, otp);
        if (!isValid) {
          throw new AuthenticationError('Invalid OTP');
        }

        // Find or create user
        let user = await UserModel.findOne({ phoneNumber });
        if (!user) {
          user = await UserModel.create({
            phoneNumber,
            role: 'CUSTOMER'
          });
        }

        // Generate JWT token
        const token = generateToken(user);
        return { token, user };
      } catch (error) {
        logger.error(`Verify OTP error: ${error.message}`);
        throw new Error(`OTP verification failed: ${error.message}`);
      }
    },

    loginWithEmail: async (_, { input: { email, password } }) => {
      try {
        const user = await UserModel.findOne({ email });
        if (!user || !await user.comparePassword(password)) {
          throw new AuthenticationError('Invalid credentials');
        }

        const token = generateToken(user);
        return { token, user };
      } catch (error) {
        logger.error(`Email login error: ${error.message}`);
        throw new Error('Login failed');
      }
    },

    registerVendor: async (_, { input }) => {
      try {
        const existingVendor = await UserModel.findOne({
          phoneNumber: input.phoneNumber
        });

        if (existingVendor) {
          throw new Error('Vendor already exists');
        }

        const vendor = await UserModel.create({
          ...input,
          role: 'VENDOR'
        });

        const token = generateToken(vendor);
        return { token, user: vendor };
      } catch (error) {
        logger.error(`Vendor registration error: ${error.message}`);
        throw new Error('Vendor registration failed');
      }
    }
  }
};