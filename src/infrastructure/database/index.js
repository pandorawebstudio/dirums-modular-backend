import mongoose from 'mongoose';
import { config } from '../../config/index.js';
import { logger } from '../../domains/shared/utils/logger.js';

export async function connectDatabase() {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

export async function closeDatabase() {
  try {
    await mongoose.connection.close();
    logger.info('Closed MongoDB connection');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
  }
}