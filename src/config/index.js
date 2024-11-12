import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'REDIS_URL',
  'JWT_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || '0.0.0.0',
  isDevelopment: process.env.NODE_ENV !== 'production',

  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  },

  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    timeWindow: '1 minute'
  },

  mongodb: {
    uri: process.env.MONGODB_URI,
    options: {
      maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE, 10) || 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  },

  redis: {
    url: process.env.REDIS_URL,
    options: {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000
    }
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    sign: {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  },

  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    s3: {
      bucket: process.env.AWS_S3_BUCKET,
      presignedUrlExpiry: parseInt(process.env.AWS_S3_URL_EXPIRY, 10) || 3600,
      maxFileSize: parseInt(process.env.AWS_S3_MAX_FILE_SIZE, 10) || 10485760, // 10MB
      allowedMimeTypes: {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        video: ['video/mp4', 'video/webm'],
        document: ['application/pdf', 'application/msword']
      }
    }
  },

  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@example.com'
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
    fromNumber: process.env.TWILIO_FROM_NUMBER
  }
};