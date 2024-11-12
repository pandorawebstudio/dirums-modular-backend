import { BaseService } from './base.service.js';
import { ProductRepository } from '../repositories/product.repository.js';
import { validateProduct } from '../validators/product.validator.js';

export class ProductService extends BaseService {
  constructor() {
    super(new ProductRepository());
  }

  async createProduct(data, userId) {
    try {
      await validateProduct(data);
      
      const slug = this.generateSlug(data.name);
      const existingProduct = await this.repository.findOne({ slug });
      
      if (existingProduct) {
        throw new Error('Product with this name already exists');
      }

      return this.create({
        ...data,
        slug,
        vendor: userId
      });
    } catch (error) {
      this.logger.error(`Error creating product: ${error.message}`);
      throw error;
    }
  }

  async updateProduct(id, data, userId) {
    try {
      const product = await this.findById(id);
      
      if (product.vendor.toString() !== userId) {
        throw new Error('Not authorized to update this product');
      }

      await validateProduct(data);
      return this.update(id, data);
    } catch (error) {
      this.logger.error(`Error updating product: ${error.message}`);
      throw error;
    }
  }

  async updateInventory(variantId, quantity, userId) {
    try {
      const product = await this.repository.findOne({ 'variants._id': variantId });
      
      if (!product) {
        throw new Error('Variant not found');
      }
      
      if (product.vendor.toString() !== userId) {
        throw new Error('Not authorized to update inventory');
      }

      const variant = product.variants.id(variantId);
      variant.inventory = quantity;
      await product.save();

      return variant;
    } catch (error) {
      this.logger.error(`Error updating inventory: ${error.message}`);
      throw error;
    }
  }

  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}