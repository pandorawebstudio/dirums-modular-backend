import nodemailer from 'nodemailer';
import { config } from '../../../config/index.js';
import { logger } from '../../../utils/logger.js';

export class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    });
  }

  async sendEmail(to, subject, content, options = {}) {
    try {
      const mailOptions = {
        from: config.email.from,
        to,
        subject,
        ...options,
        text: content,
        html: options.html || this.convertToHtml(content)
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId}`);
      
      return info;
    } catch (error) {
      logger.error(`Email sending error: ${error.message}`);
      throw error;
    }
  }

  convertToHtml(text) {
    return text.replace(/\n/g, '<br>');
  }
}