import { ProductModel } from './model.js';
import { MediaService } from '../media/media.service.js';
import { logger } from '../../utils/logger.js';

export class ProductService {
  constructor() {
    this.mediaService = new MediaService();
  }

  async addProductMedia(productId, userId, files, type = 'GALLERY') {
    try {
      const product = await ProductModel.findById(productId);
      if (!product) throw new Error('Product not found');

      if (product.vendor.toString() !== userId) {
        throw new Error('Not authorized');
      }

      const mediaItems = [];
      for (const file of files) {
        // Initiate upload
        const { media, uploadUrl } = await this.mediaService.initiateUpload({
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          isPublic: true
        }, userId);

        // Upload file
        await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        });

        // Complete upload
        await this.mediaService.completeUpload(media.id);

        // Add to product media
        product.media.push({
          media: media.id,
          type,
          sortOrder: product.media.length
        });

        mediaItems.push(media);
      }

      await product.save();
      return mediaItems;
    } catch (error) {
      logger.error(`Add product media error: ${error.message}`);
      throw error;
    }
  }

  async addVariantMedia(productId, variantId, userId, files) {
    try {
      const product = await ProductModel.findById(productId);
      if (!product) throw new Error('Product not found');

      const variant = product.variants.id(variantId);
      if (!variant) throw new Error('Variant not found');

      if (product.vendor.toString() !== userId) {
        throw new Error('Not authorized');
      }

      const mediaItems = [];
      for (const file of files) {
        const { media, uploadUrl } = await this.mediaService.initiateUpload({
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          isPublic: true
        }, userId);

        await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        });

        await this.mediaService.completeUpload(media.id);

        variant.media.push({
          media: media.id,
          type: 'VARIANT',
          variantId: variant._id,
          sortOrder: variant.media.length
        });

        mediaItems.push(media);
      }

      await product.save();
      return mediaItems;
    } catch (error) {
      logger.error(`Add variant media error: ${error.message}`);
      throw error;
    }
  }

  async removeProductMedia(productId, mediaId, userId) {
    try {
      const product = await ProductModel.findById(productId);
      if (!product) throw new Error('Product not found');

      if (product.vendor.toString() !== userId) {
        throw new Error('Not authorized');
      }

      const mediaItem = product.media.find(m => m.media.toString() === mediaId);
      if (!mediaItem) throw new Error('Media not found');

      // Remove from product
      product.media = product.media.filter(m => m.media.toString() !== mediaId);
      await product.save();

      // Delete from storage
      await this.mediaService.deleteMedia(mediaId, userId);

      return true;
    } catch (error) {
      logger.error(`Remove product media error: ${error.message}`);
      throw error;
    }
  }

  async reorderProductMedia(productId, userId, mediaOrder) {
    try {
      const product = await ProductModel.findById(productId);
      if (!product) throw new Error('Product not found');

      if (product.vendor.toString() !== userId) {
        throw new Error('Not authorized');
      }

      // Update sort order
      for (const [index, mediaId] of mediaOrder.entries()) {
        const mediaItem = product.media.find(m => m.media.toString() === mediaId);
        if (mediaItem) {
          mediaItem.sortOrder = index;
        }
      }

      await product.save();
      return product;
    } catch (error) {
      logger.error(`Reorder product media error: ${error.message}`);
      throw error;
    }
  }
}