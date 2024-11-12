import { logger } from './logger.js';

export class Cache {
  constructor(redis, options = {}) {
    this.redis = redis;
    this.prefix = options.prefix || 'cache';
    this.defaultTTL = options.defaultTTL || 3600; // 1 hour
  }

  async get(key) {
    try {
      const value = await this.redis.get(`${this.prefix}:${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error: ${error.message}`);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      await this.redis.set(
        `${this.prefix}:${key}`,
        JSON.stringify(value),
        'EX',
        ttl
      );
      return true;
    } catch (error) {
      logger.error(`Cache set error: ${error.message}`);
      return false;
    }
  }

  async del(key) {
    try {
      await this.redis.del(`${this.prefix}:${key}`);
      return true;
    } catch (error) {
      logger.error(`Cache delete error: ${error.message}`);
      return false;
    }
  }

  createMiddleware(keyGenerator, ttl) {
    return async (request, reply) => {
      const key = keyGenerator(request);
      const cached = await this.get(key);
      
      if (cached) {
        reply.send(cached);
        return;
      }
      
      reply.hijack();
      const send = reply.send.bind(reply);
      
      reply.send = async (payload) => {
        await this.set(key, payload, ttl);
        send(payload);
      };
    };
  }
}