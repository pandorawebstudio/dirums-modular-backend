import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductService } from '../core/services/product.service.js';
import { ProductRepository } from '../core/repositories/product.repository.js';

vi.mock('../core/repositories/product.repository.js');

describe('ProductService', () => {
  let productService;
  let mockProduct;

  beforeEach(() => {
    productService = new ProductService();
    mockProduct = {
      id: '123',
      name: 'Test Product',
      slug: 'test-product',
      vendor: 'vendor123',
      variants: [{
        id: 'variant123',
        sku: 'TEST-1',
        price: 100,
        inventory: 10
      }]
    };
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const input = {
        name: 'New Product',
        variants: [{
          sku: 'NEW-1',
          price: 100,
          inventory: 10
        }]
      };

      ProductRepository.prototype.findOne.mockResolvedValue(null);
      ProductRepository.prototype.create.mockResolvedValue({
        ...input,
        slug: 'new-product',
        vendor: 'user123'
      });

      const result = await productService.createProduct(input, 'user123');
      
      expect(result.name).toBe(input.name);
      expect(result.slug).toBe('new-product');
      expect(result.vendor).toBe('user123');
    });

    it('should throw error if product name exists', async () => {
      const input = {
        name: 'Existing Product',
        variants: [{
          sku: 'EXIST-1',
          price: 100,
          inventory: 10
        }]
      };

      ProductRepository.prototype.findOne.mockResolvedValue({ ...input });

      await expect(productService.createProduct(input, 'user123'))
        .rejects.toThrow('Product with this name already exists');
    });
  });

  describe('updateInventory', () => {
    it('should update variant inventory successfully', async () => {
      ProductRepository.prototype.findOne.mockResolvedValue(mockProduct);
      ProductRepository.prototype.update.mockResolvedValue({
        ...mockProduct,
        variants: [{
          ...mockProduct.variants[0],
          inventory: 20
        }]
      });

      const result = await productService.updateInventory(
        'variant123',
        20,
        'vendor123'
      );

      expect(result.inventory).toBe(20);
    });

    it('should throw error if not authorized', async () => {
      ProductRepository.prototype.findOne.mockResolvedValue(mockProduct);

      await expect(productService.updateInventory(
        'variant123',
        20,
        'wrongVendor'
      )).rejects.toThrow('Not authorized to update inventory');
    });
  });
});