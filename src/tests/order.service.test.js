import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderService } from '../core/services/order.service.js';
import { OrderRepository } from '../core/repositories/order.repository.js';
import { ProductService } from '../core/services/product.service.js';

vi.mock('../core/repositories/order.repository.js');
vi.mock('../core/services/product.service.js');

describe('OrderService', () => {
  let orderService;
  let mockOrder;
  let mockProduct;

  beforeEach(() => {
    orderService = new OrderService();
    mockProduct = {
      id: 'product123',
      name: 'Test Product',
      vendor: 'vendor123',
      variants: [{
        id: 'variant123',
        price: 100,
        inventory: 10
      }]
    };
    mockOrder = {
      id: 'order123',
      customer: 'user123',
      items: [{
        product: mockProduct.id,
        variant: mockProduct.variants[0].id,
        quantity: 2,
        price: 100
      }],
      status: 'PENDING',
      total: 220
    };
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const input = {
        items: [{
          productId: mockProduct.id,
          variantId: mockProduct.variants[0].id,
          quantity: 2
        }],
        shippingAddress: {
          street: '123 Main St',
          city: 'Test City',
          state: 'TS',
          country: 'Test Country',
          zipCode: '12345'
        },
        paymentMethod: 'CREDIT_CARD'
      };

      ProductService.prototype.findById.mockResolvedValue(mockProduct);
      OrderRepository.prototype.create.mockResolvedValue(mockOrder);

      const result = await orderService.createOrder(input, 'user123');
      
      expect(result.customer).toBe('user123');
      expect(result.total).toBe(220);
      expect(result.status).toBe('PENDING');
    });

    it('should throw error if insufficient inventory', async () => {
      const input = {
        items: [{
          productId: mockProduct.id,
          variantId: mockProduct.variants[0].id,
          quantity: 20
        }],
        shippingAddress: {
          street: '123 Main St',
          city: 'Test City',
          state: 'TS',
          country: 'Test Country',
          zipCode: '12345'
        },
        paymentMethod: 'CREDIT_CARD'
      };

      ProductService.prototype.findById.mockResolvedValue(mockProduct);

      await expect(orderService.createOrder(input, 'user123'))
        .rejects.toThrow('Insufficient inventory');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order successfully', async () => {
      OrderRepository.prototype.findById.mockResolvedValue(mockOrder);
      ProductService.prototype.findById.mockResolvedValue(mockProduct);
      OrderRepository.prototype.update.mockResolvedValue({
        ...mockOrder,
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED'
      });

      const result = await orderService.cancelOrder('order123', 'user123');
      
      expect(result.status).toBe('CANCELLED');
      expect(result.paymentStatus).toBe('REFUNDED');
    });

    it('should throw error if order cannot be cancelled', async () => {
      OrderRepository.prototype.findById.mockResolvedValue({
        ...mockOrder,
        status: 'SHIPPED'
      });

      await expect(orderService.cancelOrder('order123', 'user123'))
        .rejects.toThrow('Order cannot be cancelled');
    });
  });
});