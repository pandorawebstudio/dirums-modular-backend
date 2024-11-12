import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.isDevelopment ? 'debug' : 'info',
  transport: config.isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  } : undefined
});