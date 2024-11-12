import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { app } from '../../server.js';
import { connectDatabase, closeDatabase } from '../../infrastructure/database/index.js';

describe('Auth API Integration Tests', () => {
  let request;

  beforeAll(async () => {
    await connectDatabase();
    request = supertest(app);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should fail with invalid credentials', async () => {
      const response = await request
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await request
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'newuser@example.com');
    });

    it('should fail with existing email', async () => {
      const response = await request
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});