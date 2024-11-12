import sharp from 'sharp';
import { MediaModel } from './model.js';
import { S3Service } from './s3.service.js';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

export class MediaService {
  constructor() {
    this.s3Service = new S3Service();
  }

  async initiateUpload(data, userId) {
    try {
      const {
        fileName,
        mimeType,
        size,
        isPublic = false
      } = data;

      // Validate file size
      if (size > config.aws.s3.maxFileSize) {
        throw new Error('File size exceeds limit');
      }

      // Generate S3 key
      const key = this.s3Service.generateKey(fileName, userId);

      // Create media record
      const media = new MediaModel({
        key,
        originalName: fileName,
        mimeType,
        size,
        type: this.s3Service.getMediaType(mimeType),
        uploadedBy: userId,
        isPublic
      });

      await media.save();

      // Generate presigned URL
      const uploadUrl = await this.s3Service.generateUploadUrl(key, mimeType, {
        originalName: fileName,
        uploadedBy: userId
      });

      return {
        media,
        uploadUrl
      };
    } catch (error) {
      logger.error(`Initiate upload error: ${error.message}`);
      throw error;
    }
  }

  async completeUpload(mediaId) {
    try {
      const media = await MediaModel.findById(mediaId);
      if (!media) throw new Error('Media not found');

      media.status = 'PROCESSING';
      await media.save();

      // Process media based on type
      switch (media.type) {
        case 'IMAGE':
          await this.processImage(media);
          break;
        case 'VIDEO':
          await this.processVideo(media);
          break;
        case 'DOCUMENT':
          await this.processDocument(media);
          break;
      }

      // Generate public URL if needed
      if (media.isPublic) {
        media.url = await this.s3Service.generateDownloadUrl(media.key, {
          expiresIn: 31536000 // 1 year
        });
      }

      media.status = 'READY';
      await media.save();

      return media;
    } catch (error) {
      logger.error(`Complete upload error: ${error.message}`);
      
      const media = await MediaModel.findById(mediaId);
      if (media) {
        media.status = 'ERROR';
        media.error = error.message;
        await media.save();
      }
      
      throw error;
    }
  }

  async processImage(media) {
    try {
      // Get image buffer
      const imageUrl = await this.s3Service.generateDownloadUrl(media.key);
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();

      // Get image metadata
      const metadata = await sharp(buffer).metadata();
      
      media.metadata = {
        width: metadata.width,
        height: metadata.height,
        thumbnails: []
      };

      // Generate thumbnails
      const thumbnailSizes = [
        { width: 100, height: 100 },
        { width: 300, height: 300 },
        { width: 600, height: 600 }
      ];

      for (const size of thumbnailSizes) {
        const thumbnailKey = `thumbnails/${media.key}-${size.width}x${size.height}`;
        const thumbnailBuffer = await sharp(buffer)
          .resize(size.width, size.height, {
            fit: 'cover',
            withoutEnlargement: true
          })
          .toBuffer();

        // Upload thumbnail
        const uploadUrl = await this.s3Service.generateUploadUrl(
          thumbnailKey,
          media.mimeType
        );
        
        await fetch(uploadUrl, {
          method: 'PUT',
          body: thumbnailBuffer,
          headers: {
            'Content-Type': media.mimeType
          }
        });

        media.metadata.thumbnails.push({
          key: thumbnailKey,
          width: size.width,
          height: size.height
        });
      }

      await media.save();
    } catch (error) {
      logger.error(`Process image error: ${error.message}`);
      throw error;
    }
  }

  async processVideo(media) {
    // Implement video processing logic
    // This could include generating thumbnails, transcoding, etc.
    return media;
  }

  async processDocument(media) {
    // Implement document processing logic
    // This could include generating previews, extracting metadata, etc.
    return media;
  }

  async getMedia(mediaId, userId) {
    try {
      const media = await MediaModel.findById(mediaId);
      if (!media) throw new Error('Media not found');

      // Check access
      if (!media.isPublic && media.uploadedBy.toString() !== userId) {
        throw new Error('Not authorized');
      }

      // Generate download URL if not public
      if (!media.isPublic) {
        media.url = await this.s3Service.generateDownloadUrl(media.key);
      }

      return media;
    } catch (error) {
      logger.error(`Get media error: ${error.message}`);
      throw error;
    }
  }

  async deleteMedia(mediaId, userId) {
    try {
      const media = await MediaModel.findById(mediaId);
      if (!media) throw new Error('Media not found');

      // Check ownership
      if (media.uploadedBy.toString() !== userId) {
        throw new Error('Not authorized');
      }

      // Delete file and thumbnails from S3
      await this.s3Service.deleteFile(media.key);
      
      if (media.metadata?.thumbnails) {
        for (const thumbnail of media.metadata.thumbnails) {
          await this.s3Service.deleteFile(thumbnail.key);
        }
      }

      await media.remove();
      return true;
    } catch (error) {
      logger.error(`Delete media error: ${error.message}`);
      throw error;
    }
  }
}