import { CheckoutSession } from './model.js';
import { CartService } from '../cart/cart.service.js';
import { OrderService } from '../../core/services/order.service.js';
import { PaymentService } from './payment.service.js';
import { TaxService } from '../../core/services/tax.service.js';
import { ShippingService } from '../../core/services/shipping.service.js';
import { logger } from '../../utils/logger.js';

export class CheckoutService {
  constructor() {
    this.cartService = new CartService();
    this.orderService = new OrderService();
    this.paymentService = new PaymentService();
    this.taxService = new TaxService();
    this.shippingService = new ShippingService();
  }

  async createSession(userId) {
    try {
      const cart = await this.cartService.getCart(userId);
      if (cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Set expiration time (e.g., 1 hour)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      const session = new CheckoutSession({
        user: userId,
        cart: cart._id,
        status: 'PENDING',
        expiresAt
      });

      return session.save();
    } catch (error) {
      logger.error(`Create checkout session error: ${error.message}`);
      throw error;
    }
  }

  async updateSession(sessionId, userId, data) {
    try {
      const session = await this.getSession(sessionId, userId);
      
      Object.assign(session, data);
      session.status = 'PENDING';
      
      return session.save();
    } catch (error) {
      logger.error(`Update checkout session error: ${error.message}`);
      throw error;
    }
  }

  async getSession(sessionId, userId) {
    try {
      const session = await CheckoutSession.findOne({
        _id: sessionId,
        user: userId
      }).populate('cart');

      if (!session) throw new Error('Checkout session not found');
      if (session.status === 'COMPLETED') {
        throw new Error('Checkout session already completed');
      }
      if (new Date() > session.expiresAt) {
        throw new Error('Checkout session expired');
      }

      return session;
    } catch (error) {
      logger.error(`Get checkout session error: ${error.message}`);
      throw error;
    }
  }

  async calculateTotals(sessionId, userId) {
    try {
      const session = await this.getSession(sessionId, userId);
      const cart = await this.cartService.getCart(userId);

      // Calculate shipping
      const shippingMethods = await this.shippingService.calculateShipping(
        cart.items,
        session.shippingAddress
      );
      const shipping = shippingMethods[0].cost;

      // Calculate tax
      const tax = await this.taxService.calculateTax(
        cart.items,
        session.shippingAddress
      );

      // Get cart totals
      const { subtotal, discount } = cart.metadata;

      const total = subtotal + shipping + tax - discount;

      session.summary = {
        subtotal,
        shipping,
        tax,
        discount,
        total
      };

      await session.save();
      return session;
    } catch (error) {
      logger.error(`Calculate totals error: ${error.message}`);
      throw error;
    }
  }

  async processPayment(sessionId, userId, paymentData) {
    try {
      const session = await this.getSession(sessionId, userId);
      
      session.status = 'PROCESSING';
      await session.save();

      const paymentResult = await this.paymentService.processPayment({
        amount: session.summary.total,
        currency: 'USD',
        paymentMethod: session.paymentMethod,
        ...paymentData
      });

      session.paymentDetails = {
        provider: paymentResult.provider,
        transactionId: paymentResult.transactionId,
        status: paymentResult.status,
        amount: paymentResult.amount,
        currency: paymentResult.currency,
        metadata: paymentResult.metadata
      };

      if (paymentResult.status === 'succeeded') {
        return this.completeCheckout(session);
      } else {
        session.status = 'FAILED';
        await session.save();
        throw new Error('Payment failed');
      }
    } catch (error) {
      logger.error(`Process payment error: ${error.message}`);
      throw error;
    }
  }

  async completeCheckout(session) {
    try {
      // Create order
      const order = await this.orderService.createOrder({
        customer: session.user,
        items: session.cart.items,
        shippingAddress: session.shippingAddress,
        billingAddress: session.billingAddress,
        paymentMethod: session.paymentMethod,
        paymentDetails: session.paymentDetails,
        summary: session.summary
      });

      // Clear cart
      await this.cartService.clearCart(session.user);

      // Update session
      session.status = 'COMPLETED';
      await session.save();

      return {
        session,
        order
      };
    } catch (error) {
      logger.error(`Complete checkout error: ${error.message}`);
      throw error;
    }
  }

  async validateCheckout(sessionId, userId) {
    try {
      const session = await this.getSession(sessionId, userId);
      const cart = await this.cartService.getCart(userId);

      const validations = {
        items: await this.validateItems(cart.items),
        address: this.validateAddress(session.shippingAddress),
        payment: this.validatePaymentMethod(session.paymentMethod)
      };

      const isValid = Object.values(validations)
        .every(validation => validation.valid);

      return {
        isValid,
        validations
      };
    } catch (error) {
      logger.error(`Validate checkout error: ${error.message}`);
      throw error;
    }
  }

  async validateItems(items) {
    const invalidItems = [];

    for (const item of items) {
      const product = await this.productService.findById(item.product);
      const variant = product.variants.id(item.variant);

      if (!product || !variant || variant.inventory < item.quantity) {
        invalidItems.push(item);
      }
    }

    return {
      valid: invalidItems.length === 0,
      invalidItems
    };
  }

  validateAddress(address) {
    const requiredFields = ['street', 'city', 'state', 'country', 'zipCode'];
    const missingFields = requiredFields.filter(field => !address?.[field]);

    return {
      valid: missingFields.length === 0,
      missingFields
    };
  }

  validatePaymentMethod(paymentMethod) {
    const validMethods = ['CREDIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'COD'];
    
    return {
      valid: validMethods.includes(paymentMethod),
      message: validMethods.includes(paymentMethod)
        ? 'Valid payment method'
        : 'Invalid payment method'
    };
  }
}