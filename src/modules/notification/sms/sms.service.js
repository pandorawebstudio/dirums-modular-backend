import { SMSProvider, SMSTemplate, SMSLog } from './model.js';
import { TwilioProvider } from './providers/twilio.provider.js';
import { MSG91Provider } from './providers/msg91.provider.js';
import { FirebaseProvider } from './providers/firebase.provider.js';
import { logger } from '../../../utils/logger.js';

export class SMSService {
  constructor() {
    this.providers = new Map();
    this.defaultProvider = null;
  }

  async initialize() {
    try {
      const providers = await SMSProvider.find({ status: 'ACTIVE' });
      
      for (const provider of providers) {
        const instance = this.createProviderInstance(provider);
        this.providers.set(provider.name, instance);
        
        if (provider.isDefault) {
          this.defaultProvider = instance;
        }
      }
    } catch (error) {
      logger.error(`SMS service initialization error: ${error.message}`);
      throw error;
    }
  }

  createProviderInstance(config) {
    switch (config.provider) {
      case 'TWILIO':
        return new TwilioProvider(config);
      case 'MSG91':
        return new MSG91Provider(config);
      case 'FIREBASE':
        return new FirebaseProvider(config);
      default:
        throw new Error(`Unsupported SMS provider: ${config.provider}`);
    }
  }

  async sendSMS(to, templateName, variables = {}, preferredProvider = null) {
    try {
      // Validate phone number
      if (!this.validatePhoneNumber(to)) {
        throw new Error('Invalid phone number');
      }

      // Get template
      const template = await SMSTemplate.findOne({
        name: templateName,
        status: 'ACTIVE'
      });

      if (!template) {
        throw new Error(`Template not found: ${templateName}`);
      }

      // Process template
      const content = this.processTemplate(template.content, variables);

      // Get provider
      let provider = preferredProvider
        ? this.providers.get(preferredProvider)
        : this.defaultProvider;

      if (!provider) {
        throw new Error('No SMS provider available');
      }

      // Create log entry
      const log = new SMSLog({
        provider: provider.config.name,
        template: template._id,
        to,
        content
      });

      try {
        // Send SMS
        const result = await provider.sendSMS(to, content);
        
        log.status = 'SENT';
        log.metadata = result;
        await log.save();

        return result;
      } catch (error) {
        // Try fallback providers
        const fallbackResult = await this.tryFallbackProviders(
          provider.config.name,
          to,
          content
        );

        log.status = fallbackResult ? 'SENT' : 'FAILED';
        log.error = fallbackResult ? null : error.message;
        log.metadata = fallbackResult || { error: error.message };
        await log.save();

        if (!fallbackResult) {
          throw error;
        }

        return fallbackResult;
      }
    } catch (error) {
      logger.error(`Send SMS error: ${error.message}`);
      throw error;
    }
  }

  async tryFallbackProviders(excludeProvider, to, content) {
    const sortedProviders = Array.from(this.providers.values())
      .filter(p => p.config.name !== excludeProvider)
      .sort((a, b) => b.config.priority - a.config.priority);

    for (const provider of sortedProviders) {
      try {
        return await provider.sendSMS(to, content);
      } catch (error) {
        logger.error(
          `Fallback provider ${provider.config.name} failed: ${error.message}`
        );
        continue;
      }
    }

    return null;
  }

  processTemplate(template, variables) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (!variables.hasOwnProperty(key)) {
        throw new Error(`Missing template variable: ${key}`);
      }
      return variables[key];
    });
  }

  validatePhoneNumber(phoneNumber) {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  async getMessageStatus(messageId, provider) {
    try {
      const providerInstance = this.providers.get(provider);
      if (!providerInstance) {
        throw new Error(`Provider not found: ${provider}`);
      }

      const status = await providerInstance.getStatus(messageId);
      
      // Update log
      await SMSLog.findOneAndUpdate(
        { 'metadata.messageId': messageId },
        {
          $set: {
            status: status.status === 'delivered' ? 'DELIVERED' : 'SENT',
            error: status.error
          }
        }
      );

      return status;
    } catch (error) {
      logger.error(`Get message status error: ${error.message}`);
      throw error;
    }
  }
}