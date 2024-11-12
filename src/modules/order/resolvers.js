import mercurius from 'mercurius';
import { OrderModel } from './model.js';
import { ProductModel } from '../product/model.js';

const AuthenticationError = (message) => new mercurius.ErrorWithProps(message, { code: 'UNAUTHORIZED' });

export const orderResolvers = {
  Query: {
    orders: async (_, { limit = 20, offset = 0, status, customerId }, { auth }) => {
      if (!auth.user) throw AuthenticationError('Not authenticated');

      const query = {};
      if (status) query.status = status;
      
      if (auth.user.role === 'CUSTOMER') {
        query.customer = auth.user.id;
      } else if (auth.user.role === 'VENDOR') {
        const products = await ProductModel.find({ vendor: auth.user.id });
        query['items.product'] = { $in: products.map(p => p._id) };
      } else if (customerId && auth.user.role === 'ADMIN') {
        query.customer = customerId;
      }

      return OrderModel.find(query)
        .populate('customer items.product items.variant')
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 });
    },

    order: async (_, { id }, { auth }) => {
      if (!auth.user) throw AuthenticationError('Not authenticated');

      const order = await OrderModel.findById(id)
        .populate('customer items.product items.variant');

      if (!order) throw new Error('Order not found');

      if (auth.user.role === 'CUSTOMER' && order.customer.toString() !== auth.user.id) {
        throw AuthenticationError('Not authorized');
      }

      if (auth.user.role === 'VENDOR') {
        const products = await ProductModel.find({ vendor: auth.user.id });
        const productIds = products.map(p => p._id.toString());
        const hasAccess = order.items.some(item => 
          productIds.includes(item.product._id.toString())
        );
        if (!hasAccess) throw AuthenticationError('Not authorized');
      }

      return order;
    }
  },

  Mutation: {
    createOrder: async (_, { input }, { auth }) => {
      if (!auth.user) throw AuthenticationError('Not authenticated');

      let subtotal = 0;
      const orderItems = [];

      for (const item of input.items) {
        const product = await ProductModel.findById(item.productId);
        if (!product) throw new Error(`Product not found: ${item.productId}`);

        const variant = product.variants.id(item.variantId);
        if (!variant) throw new Error(`Variant not found: ${item.variantId}`);

        if (variant.inventory < item.quantity) {
          throw new Error(`Insufficient inventory for ${product.name}`);
        }

        variant.inventory -= item.quantity;
        await product.save();

        orderItems.push({
          product: item.productId,
          variant: item.variantId,
          quantity: item.quantity,
          price: variant.price
        });

        subtotal += variant.price * item.quantity;
      }

      const tax = subtotal * 0.1; // 10% tax
      const shippingCost = 10; // Fixed shipping cost
      const total = subtotal + tax + shippingCost;

      const order = new OrderModel({
        customer: auth.user.id,
        items: orderItems,
        shippingAddress: input.shippingAddress,
        paymentMethod: input.paymentMethod,
        notes: input.notes,
        subtotal,
        tax,
        shippingCost,
        total
      });

      return order.save();
    },

    updateOrderStatus: async (_, { id, status }, { auth }) => {
      if (!auth.user || !['ADMIN', 'VENDOR'].includes(auth.user.role)) {
        throw AuthenticationError('Not authorized');
      }

      const order = await OrderModel.findById(id);
      if (!order) throw new Error('Order not found');

      if (auth.user.role === 'VENDOR') {
        const products = await ProductModel.find({ vendor: auth.user.id });
        const productIds = products.map(p => p._id.toString());
        const hasAccess = order.items.some(item => 
          productIds.includes(item.product.toString())
        );
        if (!hasAccess) throw AuthenticationError('Not authorized');
      }

      return OrderModel.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true }
      ).populate('customer items.product items.variant');
    },

    updatePaymentStatus: async (_, { id, status }, { auth }) => {
      if (!auth.user || !['ADMIN'].includes(auth.user.role)) {
        throw AuthenticationError('Not authorized');
      }

      return OrderModel.findByIdAndUpdate(
        id,
        { $set: { paymentStatus: status } },
        { new: true }
      ).populate('customer items.product items.variant');
    },

    cancelOrder: async (_, { id }, { auth }) => {
      if (!auth.user) throw AuthenticationError('Not authenticated');

      const order = await OrderModel.findById(id);
      if (!order) throw new Error('Order not found');

      if (
        auth.user.role !== 'ADMIN' && 
        order.customer.toString() !== auth.user.id
      ) {
        throw AuthenticationError('Not authorized');
      }

      if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
        throw new Error('Order cannot be cancelled');
      }

      // Restore inventory
      for (const item of order.items) {
        const product = await ProductModel.findById(item.product);
        const variant = product.variants.id(item.variant);
        variant.inventory += item.quantity;
        await product.save();
      }

      return OrderModel.findByIdAndUpdate(
        id,
        { 
          $set: { 
            status: 'CANCELLED',
            paymentStatus: 'REFUNDED'
          }
        },
        { new: true }
      ).populate('customer items.product items.variant');
    }
  }
};