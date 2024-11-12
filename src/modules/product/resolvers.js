import { ProductModel } from './model.js';
import { ProductApprovalService } from './approval.service.js';
import { PERMISSIONS } from '../auth/rbac/roles.js';
import { logger } from '../../utils/logger.js';

const productApprovalService = new ProductApprovalService();

export const productResolvers = {
  Query: {
    pendingApprovals: async (_, { limit = 20, offset = 0 }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');

      const hasPermission = await rbacService.hasPermission(
        auth.user,
        PERMISSIONS.MANAGE_SETTINGS
      );
      if (!hasPermission) throw new Error('Not authorized');

      return ProductModel.find({ status: 'PENDING_APPROVAL' })
        .populate('vendor category')
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 });
    },

    productApprovalHistory: async (_, { id }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');

      const product = await ProductModel.findById(id);
      if (!product) throw new Error('Product not found');

      // Check if user is authorized to view history
      const isVendor = product.vendor.toString() === auth.user.id;
      const hasPermission = await rbacService.hasPermission(
        auth.user,
        PERMISSIONS.MANAGE_SETTINGS
      );

      if (!isVendor && !hasPermission) {
        throw new Error('Not authorized');
      }

      return productApprovalService.getApprovalHistory(id);
    }
  },

  Mutation: {
    submitProductForApproval: async (_, { productId, comment }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');

      const hasPermission = await rbacService.hasPermission(
        auth.user,
        PERMISSIONS.CREATE_PRODUCT
      );
      if (!hasPermission) throw new Error('Not authorized');

      return productApprovalService.submitForApproval(
        productId,
        auth.user.id,
        comment
      );
    },

    reviewProduct: async (_, { productId, decision, comment }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');

      const hasPermission = await rbacService.hasPermission(
        auth.user,
        PERMISSIONS.MANAGE_SETTINGS
      );
      if (!hasPermission) throw new Error('Not authorized');

      return productApprovalService.reviewProduct(
        productId,
        auth.user.id,
        decision,
        comment
      );
    },

    addProductMessage: async (_, { productId, message }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');

      const product = await ProductModel.findById(productId);
      if (!product) throw new Error('Product not found');

      // Check if user is authorized to add messages
      const isVendor = product.vendor.toString() === auth.user.id;
      const hasPermission = await rbacService.hasPermission(
        auth.user,
        PERMISSIONS.MANAGE_SETTINGS
      );

      if (!isVendor && !hasPermission) {
        throw new Error('Not authorized');
      }

      return productApprovalService.addMessage(
        productId,
        auth.user.id,
        message.content,
        message.attachments
      );
    },

    createProduct: async (_, { input }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');

      const hasPermission = await rbacService.hasPermission(
        auth.user,
        PERMISSIONS.CREATE_PRODUCT
      );
      if (!hasPermission) throw new Error('Not authorized');

      const product = new ProductModel({
        ...input,
        vendor: auth.user.id,
        slug: input.name.toLowerCase().replace(/\s+/g, '-'),
        status: input.requiresApproval ? 'DRAFT' : 'ACTIVE',
        isPublished: !input.requiresApproval
      });

      await product.save();

      // Track initial revision
      await productApprovalService.trackRevision(
        product._id,
        auth.user.id,
        [],
        'Initial creation'
      );

      return product;
    },

    updateProduct: async (_, { id, input }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');

      const product = await ProductModel.findById(id);
      if (!product) throw new Error('Product not found');

      const isVendor = product.vendor.toString() === auth.user.id;
      const hasPermission = await rbacService.hasPermission(
        auth.user,
        PERMISSIONS.UPDATE_PRODUCT
      );

      if (!isVendor && !hasPermission) {
        throw new Error('Not authorized');
      }

      // Track changes before update
      const changes = productApprovalService.getProductChanges({
        ...product.toObject(),
        ...input
      });

      const updatedProduct = await ProductModel.findByIdAndUpdate(
        id,
        { 
          $set: {
            ...input,
            status: product.requiresApproval ? 'DRAFT' : 'ACTIVE'
          }
        },
        { new: true }
      );

      // Track revision
      await productApprovalService.trackRevision(
        id,
        auth.user.id,
        changes,
        'Product update'
      );

      return updatedProduct;
    }
  }
};