import Redis from 'ioredis';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

let redisClient;

export async function connectCache() {
  try {
    redisClient = new Redis(config.redis.url, config.redis.options);
    logger.info('Connected to Redis');
    return redisClient;
  } catch (error) {
    logger.error('Redis connection error:', error);
    process.exit(1);
  }
}

export async function closeCache() {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Closed Redis connection');
    }
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
}

export function getRedisClient() {
  return redisClient;
}