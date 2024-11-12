import { CartModel } from './model.js';
import { ProductService } from '../product/product.service.js';
import { PricingService } from '../pricing/pricing.service.js';
import { logger } from '../../utils/logger.js';

export class CartService {
  constructor() {
    this.productService = new ProductService();
    this.pricingService = new PricingService();
  }

  async getCart(userId) {
    try {
      let cart = await CartModel.findOne({ user: userId })
        .populate('items.product items.variant');

      if (!cart) {
        cart = await this.createCart(userId);
      }

      return cart;
    } catch (error) {
      logger.error(`Get cart error: ${error.message}`);
      throw error;
    }
  }

  async createCart(userId) {
    try {
      const cart = new CartModel({
        user: userId,
        items: []
      });
      return cart.save();
    } catch (error) {
      logger.error(`Create cart error: ${error.message}`);
      throw error;
    }
  }

  async addItem(userId, { productId, variantId, quantity, options }) {
    try {
      const cart = await this.getCart(userId);
      const product = await this.productService.findById(productId);
      
      if (!product) throw new Error('Product not found');
      
      const variant = product.variants.id(variantId);
      if (!variant) throw new Error('Variant not found');

      if (variant.inventory < quantity) {
        throw new Error('Insufficient inventory');
      }

      // Check if item already exists
      const existingItem = cart.items.find(item => 
        item.product.equals(productId) && 
        item.variant.equals(variantId)
      );

      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.price = variant.price;
        existingItem.selectedOptions = options;
      } else {
        cart.items.push({
          product: productId,
          variant: variantId,
          quantity,
          price: variant.price,
          selectedOptions: options
        });
      }

      cart.lastActivity = new Date();
      await cart.save();

      return this.recalculateCart(cart);
    } catch (error) {
      logger.error(`Add to cart error: ${error.message}`);
      throw error;
    }
  }

  async updateItem(userId, itemId, { quantity, options }) {
    try {
      const cart = await this.getCart(userId);
      const item = cart.items.id(itemId);
      
      if (!item) throw new Error('Item not found in cart');

      const product = await this.productService.findById(item.product);
      const variant = product.variants.id(item.variant);

      if (variant.inventory < quantity) {
        throw new Error('Insufficient inventory');
      }

      item.quantity = quantity;
      item.selectedOptions = options;
      cart.lastActivity = new Date();
      
      await cart.save();
      return this.recalculateCart(cart);
    } catch (error) {
      logger.error(`Update cart item error: ${error.message}`);
      throw error;
    }
  }

  async removeItem(userId, itemId) {
    try {
      const cart = await this.getCart(userId);
      cart.items = cart.items.filter(item => !item._id.equals(itemId));
      cart.lastActivity = new Date();
      
      await cart.save();
      return this.recalculateCart(cart);
    } catch (error) {
      logger.error(`Remove cart item error: ${error.message}`);
      throw error;
    }
  }

  async applyCoupon(userId, couponCode) {
    try {
      const cart = await this.getCart(userId);
      const discount = await this.pricingService.validateCoupon(
        couponCode,
        cart.items
      );

      if (!discount) throw new Error('Invalid or expired coupon');

      cart.appliedCoupons.push({
        code: couponCode,
        discountAmount: discount.amount,
        type: discount.type
      });

      cart.lastActivity = new Date();
      await cart.save();

      return this.recalculateCart(cart);
    } catch (error) {
      logger.error(`Apply coupon error: ${error.message}`);
      throw error;
    }
  }

  async removeCoupon(userId, couponCode) {
    try {
      const cart = await this.getCart(userId);
      cart.appliedCoupons = cart.appliedCoupons.filter(
        coupon => coupon.code !== couponCode
      );
      
      cart.lastActivity = new Date();
      await cart.save();

      return this.recalculateCart(cart);
    } catch (error) {
      logger.error(`Remove coupon error: ${error.message}`);
      throw error;
    }
  }

  async clearCart(userId) {
    try {
      const cart = await this.getCart(userId);
      cart.items = [];
      cart.appliedCoupons = [];
      cart.lastActivity = new Date();
      
      await cart.save();
      return cart;
    } catch (error) {
      logger.error(`Clear cart error: ${error.message}`);
      throw error;
    }
  }

  async recalculateCart(cart) {
    try {
      let subtotal = 0;
      let totalDiscount = 0;

      // Calculate items total
      for (const item of cart.items) {
        const product = await this.productService.findById(item.product);
        const variant = product.variants.id(item.variant);
        item.price = variant.price;
        subtotal += item.price * item.quantity;
      }

      // Apply discounts
      for (const coupon of cart.appliedCoupons) {
        if (coupon.type === 'PERCENTAGE') {
          totalDiscount += (subtotal * coupon.discountAmount) / 100;
        } else {
          totalDiscount += coupon.discountAmount;
        }
      }

      cart.metadata = {
        subtotal,
        discount: totalDiscount,
        total: subtotal - totalDiscount
      };

      await cart.save();
      return cart;
    } catch (error) {
      logger.error(`Recalculate cart error: ${error.message}`);
      throw error;
    }
  }
}