import { OrderModel } from './model.js';
import { ProductModel } from '../product/model.js';
import { CartService } from '../cart/cart.service.js';
import { logger } from '../../utils/logger.js';

export class OrderService {
  constructor() {
    this.cartService = new CartService();
  }

  async createOrder(data, userId) {
    try {
      // Process items and check inventory
      const processedItems = await this.processOrderItems(data.items);
      
      // Calculate totals
      const { subtotal, tax, total } = await this.calculateTotals(processedItems);

      // Create order
      const order = new OrderModel({
        customer: userId,
        items: processedItems,
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress || data.shippingAddress,
        paymentMethod: data.paymentMethod,
        subtotal,
        tax,
        shippingCost: data.shippingCost || 0,
        total,
        notes: data.notes,
        status: 'PENDING'
      });

      // Update inventory
      await this.updateInventory(processedItems);

      // Save and return order
      await order.save();
      return order;
    } catch (error) {
      logger.error(`Order creation error: ${error.message}`);
      throw error;
    }
  }

  async processOrderItems(items) {
    const processedItems = [];

    for (const item of items) {
      const product = await ProductModel.findById(item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);

      const variant = product.variants.id(item.variantId);
      if (!variant) throw new Error(`Variant not found: ${item.variantId}`);

      if (variant.inventory < item.quantity) {
        throw new Error(`Insufficient inventory for ${product.name}`);
      }

      processedItems.push({
        product: item.productId,
        variant: item.variantId,
        quantity: item.quantity,
        price: variant.price
      });
    }

    return processedItems;
  }

  async calculateTotals(items) {
    const subtotal = items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0);
    
    const tax = subtotal * 0.1; // 10% tax rate
    const total = subtotal + tax;

    return { subtotal, tax, total };
  }

  async updateInventory(items, increase = false) {
    for (const item of items) {
      const product = await ProductModel.findById(item.product);
      const variant = product.variants.id(item.variant);
      
      variant.inventory = increase
        ? variant.inventory + item.quantity
        : variant.inventory - item.quantity;

      await product.save();
    }
  }

  async getOrder(orderId, userId) {
    try {
      const order = await OrderModel.findById(orderId)
        .populate('customer items.product items.variant');

      if (!order) throw new Error('Order not found');

      // Check authorization
      if (order.customer.toString() !== userId) {
        throw new Error('Not authorized to view this order');
      }

      return order;
    } catch (error) {
      logger.error(`Get order error: ${error.message}`);
      throw error;
    }
  }

  async getUserOrders(userId, { status, limit = 20, offset = 0 }) {
    try {
      const query = { customer: userId };
      if (status) query.status = status;

      return OrderModel.find(query)
        .populate('items.product items.variant')
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.error(`Get user orders error: ${error.message}`);
      throw error;
    }
  }

  async updateOrderStatus(orderId, userId, status) {
    try {
      const order = await this.getOrder(orderId, userId);
      
      if (!this.canUpdateStatus(order, status)) {
        throw new Error(`Cannot update order to status: ${status}`);
      }

      order.status = status;
      return order.save();
    } catch (error) {
      logger.error(`Update order status error: ${error.message}`);
      throw error;
    }
  }

  async cancelOrder(orderId, userId) {
    try {
      const order = await this.getOrder(orderId, userId);

      if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
        throw new Error('Order cannot be cancelled');
      }

      // Restore inventory
      await this.updateInventory(order.items, true);

      order.status = 'CANCELLED';
      order.paymentStatus = 'REFUNDED';
      
      return order.save();
    } catch (error) {
      logger.error(`Cancel order error: ${error.message}`);
      throw error;
    }
  }

  canUpdateStatus(order, newStatus) {
    const statusFlow = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: []
    };

    return statusFlow[order.status]?.includes(newStatus);
  }
}