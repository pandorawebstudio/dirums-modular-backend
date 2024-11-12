import { logger } from './logger.js';

export class RateLimiter {
  constructor(redis, options = {}) {
    this.redis = redis;
    this.prefix = options.prefix || 'ratelimit';
    this.window = options.window || 60; // seconds
    this.maxHits = options.maxHits || 100;
  }

  async isRateLimited(key) {
    const redisKey = `${this.prefix}:${key}`;
    
    try {
      const hits = await this.redis.incr(redisKey);
      
      if (hits === 1) {
        await this.redis.expire(redisKey, this.window);
      }
      
      return hits > this.maxHits;
    } catch (error) {
      logger.error(`Rate limiter error: ${error.message}`);
      return false; // Fail open if Redis is down
    }
  }

  createMiddleware(keyGenerator) {
    return async (request, reply) => {
      const key = keyGenerator(request);
      const isLimited = await this.isRateLimited(key);
      
      if (isLimited) {
        reply.code(429).send({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded'
        });
      }
    };
  }
}