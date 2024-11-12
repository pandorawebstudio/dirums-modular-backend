import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import mime from 'mime-types';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

export class S3Service {
  constructor() {
    this.client = new S3Client({
      region: config.aws.region,
      credentials: config.aws.credentials
    });
    this.bucket = config.aws.s3.bucket;
  }

  async generateUploadUrl(key, mimeType, options = {}) {
    try {
      // Validate file type
      if (!this.isAllowedMimeType(mimeType)) {
        throw new Error('File type not allowed');
      }

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mimeType,
        Metadata: {
          originalname: options.originalName || '',
          uploadedby: options.uploadedBy || ''
        },
        ...this.getObjectConfig(mimeType)
      });

      return getSignedUrl(this.client, command, {
        expiresIn: config.aws.s3.presignedUrlExpiry
      });
    } catch (error) {
      logger.error(`Generate upload URL error: ${error.message}`);
      throw error;
    }
  }

  async generateDownloadUrl(key, options = {}) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      return getSignedUrl(this.client, command, {
        expiresIn: options.expiresIn || config.aws.s3.presignedUrlExpiry
      });
    } catch (error) {
      logger.error(`Generate download URL error: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      logger.error(`Delete file error: ${error.message}`);
      throw error;
    }
  }

  generateKey(fileName, userId) {
    const ext = mime.extension(mime.lookup(fileName));
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    
    return `${userId}/${timestamp}-${randomString}.${ext}`;
  }

  isAllowedMimeType(mimeType) {
    return Object.values(config.aws.s3.allowedMimeTypes)
      .flat()
      .includes(mimeType);
  }

  getMediaType(mimeType) {
    if (config.aws.s3.allowedMimeTypes.image.includes(mimeType)) {
      return 'IMAGE';
    }
    if (config.aws.s3.allowedMimeTypes.video.includes(mimeType)) {
      return 'VIDEO';
    }
    if (config.aws.s3.allowedMimeTypes.document.includes(mimeType)) {
      return 'DOCUMENT';
    }
    throw new Error('Unsupported media type');
  }

  getObjectConfig(mimeType) {
    const config = {
      CacheControl: 'max-age=31536000' // 1 year
    };

    if (this.getMediaType(mimeType) === 'IMAGE') {
      config.ContentDisposition = 'inline';
    } else {
      config.ContentDisposition = 'attachment';
    }

    return config;
  }
}