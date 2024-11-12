import { ProductModel } from './model.js';
import { NotificationService } from '../notification/notification.service.js';
import { logger } from '../../utils/logger.js';

export class ProductApprovalService {
  constructor() {
    this.notificationService = new NotificationService();
  }

  async submitForApproval(productId, userId, comment) {
    try {
      const product = await ProductModel.findById(productId);
      if (!product) throw new Error('Product not found');

      if (product.vendor.toString() !== userId) {
        throw new Error('Not authorized to submit this product');
      }

      if (product.status === 'PENDING_APPROVAL') {
        throw new Error('Product is already pending approval');
      }

      product.status = 'PENDING_APPROVAL';
      product.approval = {
        status: 'PENDING',
        changes: this.getProductChanges(product),
        comment
      };

      await product.save();

      // Notify admins
      await this.notificationService.notifyAdmins({
        type: 'PRODUCT_APPROVAL_REQUIRED',
        title: 'New Product Approval Required',
        content: `Product "${product.name}" requires approval`,
        metadata: {
          productId: product._id,
          vendorId: product.vendor
        }
      });

      return product;
    } catch (error) {
      logger.error(`Product approval submission error: ${error.message}`);
      throw error;
    }
  }

  async reviewProduct(productId, reviewerId, decision, comment) {
    try {
      const product = await ProductModel.findById(productId);
      if (!product) throw new Error('Product not found');

      if (product.status !== 'PENDING_APPROVAL') {
        throw new Error('Product is not pending approval');
      }

      product.status = decision === 'APPROVED' ? 'ACTIVE' : 'REJECTED';
      product.approval = {
        ...product.approval,
        status: decision,
        reviewer: reviewerId,
        reviewedAt: new Date(),
        comment
      };

      if (decision === 'APPROVED') {
        product.isPublished = true;
        product.publishedAt = new Date();
      }

      await product.save();

      // Notify vendor
      await this.notificationService.notify(product.vendor, {
        type: 'PRODUCT_REVIEW_COMPLETE',
        title: `Product ${decision.toLowerCase()}`,
        content: `Your product "${product.name}" has been ${decision.toLowerCase()}`,
        metadata: {
          productId: product._id,
          decision,
          comment
        }
      });

      return product;
    } catch (error) {
      logger.error(`Product review error: ${error.message}`);
      throw error;
    }
  }

  async addMessage(productId, userId, content, attachments = []) {
    try {
      const product = await ProductModel.findById(productId);
      if (!product) throw new Error('Product not found');

      const message = {
        user: userId,
        content,
        attachments,
        timestamp: new Date()
      };

      product.messages.push(message);
      await product.save();

      // Notify relevant users
      const recipientId = userId === product.vendor.toString() 
        ? product.approval?.reviewer 
        : product.vendor;

      if (recipientId) {
        await this.notificationService.notify(recipientId, {
          type: 'PRODUCT_MESSAGE',
          title: 'New message on product',
          content: `New message on product "${product.name}"`,
          metadata: {
            productId: product._id,
            messageId: message._id
          }
        });
      }

      return message;
    } catch (error) {
      logger.error(`Add message error: ${error.message}`);
      throw error;
    }
  }

  async trackRevision(productId, userId, changes, comment) {
    try {
      const product = await ProductModel.findById(productId);
      if (!product) throw new Error('Product not found');

      const revision = {
        user: userId,
        changes,
        comment,
        timestamp: new Date()
      };

      product.revisions.push(revision);
      await product.save();

      return revision;
    } catch (error) {
      logger.error(`Track revision error: ${error.message}`);
      throw error;
    }
  }

  getProductChanges(product) {
    const changes = [];
    const previousVersion = product.revisions[product.revisions.length - 1];

    if (!previousVersion) return changes;

    // Compare fields and detect changes
    const fieldsToCompare = ['name', 'description', 'price', 'category', 'tags'];
    
    for (const field of fieldsToCompare) {
      if (JSON.stringify(product[field]) !== JSON.stringify(previousVersion[field])) {
        changes.push({
          field,
          oldValue: previousVersion[field],
          newValue: product[field]
        });
      }
    }

    return changes;
  }

  async getApprovalHistory(productId) {
    try {
      const product = await ProductModel.findById(productId)
        .populate('revisions.user', 'name email')
        .populate('approval.reviewer', 'name email')
        .populate('messages.user', 'name email');

      if (!product) throw new Error('Product not found');

      return {
        currentStatus: product.status,
        approval: product.approval,
        revisions: product.revisions,
        messages: product.messages
      };
    } catch (error) {
      logger.error(`Get approval history error: ${error.message}`);
      throw error;
    }
  }
}