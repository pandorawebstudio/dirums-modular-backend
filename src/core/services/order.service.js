import { BaseService } from './base.service.js';
import { OrderRepository } from '../repositories/order.repository.js';
import { ProductService } from './product.service.js';
import { PricingService } from './pricing.service.js';
import { ShippingService } from './shipping.service.js';
import { TaxService } from './tax.service.js';
import { WorkflowService } from './workflow.service.js';
import { validateOrder } from '../validators/order.validator.js';
import { logger } from '../../utils/logger.js';

export class OrderService extends BaseService {
  constructor() {
    super(new OrderRepository());
    this.productService = new ProductService();
    this.pricingService = new PricingService();
    this.shippingService = new ShippingService();
    this.taxService = new TaxService();
    this.workflowService = new WorkflowService();
  }

  async createOrder(data, user, currency = 'USD') {
    try {
      await validateOrder(data);
      
      // Process items and check inventory
      const processedItems = await this.processOrderItems(data.items, currency);
      
      // Calculate base totals
      const subtotal = processedItems.reduce((sum, item) => 
        sum + (item.finalPrice * item.quantity), 0);

      // Calculate shipping costs
      const shippingMethods = await this.shippingService.calculateShipping(
        processedItems,
        data.shippingAddress
      );

      // Use the first shipping method as default
      const selectedShipping = shippingMethods[0];

      // Calculate tax
      const tax = await this.taxService.calculateTax(
        processedItems,
        data.shippingAddress
      );

      // Apply discounts
      const { final: discountedTotal, discounts } = 
        await this.pricingService.calculateDiscounts(
          processedItems,
          data.discountCodes || [],
          user
        );

      // Create the order
      const order = await this.create({
        customer: user.id,
        items: processedItems,
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress || data.shippingAddress,
        paymentMethod: data.paymentMethod,
        currency,
        subtotal,
        shipping: {
          method: selectedShipping.id,
          cost: selectedShipping.cost
        },
        tax,
        discounts,
        total: discountedTotal + selectedShipping.cost + tax,
        notes: data.notes,
        status: 'PENDING'
      });

      // Update inventory
      await this.updateInventory(processedItems);

      // Trigger workflows
      await this.workflowService.processOrderWorkflow(order);

      return order;
    } catch (error) {
      logger.error(`Order creation error: ${error.message}`);
      throw error;
    }
  }

  async processOrderItems(items, currency) {
    const processedItems = [];

    for (const item of items) {
      const product = await this.productService.findById(item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);

      const variant = product.variants.id(item.variantId);
      if (!variant) throw new Error(`Variant not found: ${item.variantId}`);

      if (variant.inventory < item.quantity) {
        throw new Error(`Insufficient inventory for ${product.name}`);
      }

      // Convert price to requested currency
      const finalPrice = await this.pricingService.convertPrice(
        variant.price,
        'INR',
        currency
      );

      processedItems.push({
        product: item.productId,
        variant: item.variantId,
        quantity: item.quantity,
        originalPrice: variant.price,
        finalPrice,
        currency
      });
    }

    return processedItems;
  }

  async updateInventory(items, increase = false) {
    for (const item of items) {
      const product = await this.productService.findById(item.product);
      const variant = product.variants.id(item.variant);
      
      const newInventory = increase
        ? variant.inventory + item.quantity
        : variant.inventory - item.quantity;

      await this.productService.updateInventory(
        item.variant,
        newInventory,
        product.vendor
      );
    }
  }

  async cancelOrder(id, userId) {
    try {
      const order = await this.findById(id);
      
      if (!this.canCancelOrder(order, userId)) {
        throw new Error('Not authorized to cancel order');
      }

      if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
        throw new Error('Order cannot be cancelled');
      }

      // Restore inventory
      await this.updateInventory(order.items, true);

      // Update order status
      const updatedOrder = await this.update(id, {
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED'
      });

      // Trigger cancellation workflow
      await this.workflowService.processOrderWorkflow({
        ...updatedOrder,
        previousStatus: order.status
      });

      return updatedOrder;
    } catch (error) {
      logger.error(`Order cancellation error: ${error.message}`);
      throw error;
    }
  }

  async updateOrderStatus(id, status, userId) {
    try {
      const order = await this.findById(id);
      
      if (!this.canUpdateOrderStatus(order, userId, status)) {
        throw new Error('Not authorized to update order status');
      }

      const previousStatus = order.status;
      const updatedOrder = await this.update(id, { status });

      // Trigger status change workflow
      await this.workflowService.processOrderWorkflow({
        ...updatedOrder,
        previousStatus
      });

      return updatedOrder;
    } catch (error) {
      logger.error(`Order status update error: ${error.message}`);
      throw error;
    }
  }

  canUpdateOrderStatus(order, userId, newStatus) {
    // Add role-based authorization logic
    return true;
  }

  canCancelOrder(order, userId) {
    return order.customer.toString() === userId ||
           ['ADMIN'].includes(userId.role);
  }
}