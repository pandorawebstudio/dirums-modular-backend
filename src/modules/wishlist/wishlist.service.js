import { WishlistModel } from './model.js';
import { ProductService } from '../product/product.service.js';
import { generateToken } from '../../utils/auth.js';
import { logger } from '../../utils/logger.js';

export class WishlistService {
  constructor() {
    this.productService = new ProductService();
  }

  async getWishlists(userId) {
    try {
      return WishlistModel.find({ user: userId })
        .populate('items.product');
    } catch (error) {
      logger.error(`Get wishlists error: ${error.message}`);
      throw error;
    }
  }

  async getWishlist(id, userId) {
    try {
      const wishlist = await WishlistModel.findOne({
        _id: id,
        user: userId
      }).populate('items.product');

      if (!wishlist) throw new Error('Wishlist not found');
      return wishlist;
    } catch (error) {
      logger.error(`Get wishlist error: ${error.message}`);
      throw error;
    }
  }

  async createWishlist(userId, { name, isPublic }) {
    try {
      const wishlist = new WishlistModel({
        user: userId,
        name,
        isPublic,
        items: []
      });

      if (isPublic) {
        wishlist.shareToken = generateToken();
      }

      return wishlist.save();
    } catch (error) {
      logger.error(`Create wishlist error: ${error.message}`);
      throw error;
    }
  }

  async addItem(wishlistId, userId, { productId, variantId, notes, priority }) {
    try {
      const wishlist = await this.getWishlist(wishlistId, userId);
      const product = await this.productService.findById(productId);
      
      if (!product) throw new Error('Product not found');

      const existingItem = wishlist.items.find(item => 
        item.product.equals(productId) &&
        (!variantId || item.variant?.equals(variantId))
      );

      if (existingItem) {
        existingItem.notes = notes;
        existingItem.priority = priority;
      } else {
        wishlist.items.push({
          product: productId,
          variant: variantId,
          notes,
          priority
        });
      }

      return wishlist.save();
    } catch (error) {
      logger.error(`Add to wishlist error: ${error.message}`);
      throw error;
    }
  }

  async removeItem(wishlistId, userId, itemId) {
    try {
      const wishlist = await this.getWishlist(wishlistId, userId);
      wishlist.items = wishlist.items.filter(item => !item._id.equals(itemId));
      return wishlist.save();
    } catch (error) {
      logger.error(`Remove from wishlist error: ${error.message}`);
      throw error;
    }
  }

  async updateWishlist(wishlistId, userId, { name, isPublic }) {
    try {
      const wishlist = await this.getWishlist(wishlistId, userId);
      
      wishlist.name = name;
      wishlist.isPublic = isPublic;
      
      if (isPublic && !wishlist.shareToken) {
        wishlist.shareToken = generateToken();
      } else if (!isPublic) {
        wishlist.shareToken = null;
      }

      return wishlist.save();
    } catch (error) {
      logger.error(`Update wishlist error: ${error.message}`);
      throw error;
    }
  }

  async deleteWishlist(wishlistId, userId) {
    try {
      const wishlist = await this.getWishlist(wishlistId, userId);
      await wishlist.remove();
      return true;
    } catch (error) {
      logger.error(`Delete wishlist error: ${error.message}`);
      throw error;
    }
  }

  async getSharedWishlist(shareToken) {
    try {
      const wishlist = await WishlistModel.findOne({
        shareToken,
        isPublic: true
      }).populate('items.product user', 'name email');

      if (!wishlist) throw new Error('Wishlist not found');
      return wishlist;
    } catch (error) {
      logger.error(`Get shared wishlist error: ${error.message}`);
      throw error;
    }
  }

  async moveToCart(wishlistId, userId, itemId) {
    try {
      const wishlist = await this.getWishlist(wishlistId, userId);
      const item = wishlist.items.id(itemId);
      
      if (!item) throw new Error('Item not found in wishlist');

      const cartService = new CartService();
      await cartService.addItem(userId, {
        productId: item.product,
        variantId: item.variant,
        quantity: 1
      });

      // Remove from wishlist
      await this.removeItem(wishlistId, userId, itemId);

      return true;
    } catch (error) {
      logger.error(`Move to cart error: ${error.message}`);
      throw error;
    }
  }
}