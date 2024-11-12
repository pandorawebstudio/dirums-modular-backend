import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { app } from '../../server.js';
import { connectDatabase, closeDatabase } from '../../infrastructure/database/index.js';

describe('Checkout E2E Tests', () => {
  let request;
  let authToken;

  beforeAll(async () => {
    await connectDatabase();
    request = supertest(app);

    // Login and get token
    const loginResponse = await request
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Complete Checkout Flow', () => {
    it('should complete a successful checkout', async () => {
      // Add item to cart
      const cartResponse = await request
        .post('/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'test-product-id',
          quantity: 1
        });

      expect(cartResponse.status).toBe(200);

      // Create checkout session
      const sessionResponse = await request
        .post('/checkout/session')
        .set('Authorization', `Bearer ${authToken}`);

      expect(sessionResponse.status).toBe(200);
      const sessionId = sessionResponse.body.id;

      // Add shipping address
      const addressResponse = await request
        .post(`/checkout/${sessionId}/shipping-address`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          country: 'US',
          zipCode: '12345'
        });

      expect(addressResponse.status).toBe(200);

      // Process payment
      const paymentResponse = await request
        .post(`/checkout/${sessionId}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentMethod: 'CREDIT_CARD',
          token: 'test-payment-token'
        });

      expect(paymentResponse.status).toBe(200);
      expect(paymentResponse.body).toHaveProperty('order');
      expect(paymentResponse.body.order.status).toBe('CONFIRMED');
    });
  });
});