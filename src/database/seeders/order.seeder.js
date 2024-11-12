import { OrderModel } from '../../modules/order/model.js';
import { logger } from '../../utils/logger.js';

export async function seedOrders(users, products) {
  try {
    const customer = users.find(u => u.email === 'john.doe@example.com');
    const headphones = products.find(p => p.name === 'Premium Wireless Headphones');
    const jacket = products.find(p => p.name === 'Classic Leather Jacket');

    const orders = [
      // Completed order with multiple items
      {
        customer: customer._id,
        items: [
          {
            product: headphones._id,
            variant: headphones.variants[0]._id,
            quantity: 1,
            price: headphones.variants[0].price
          },
          {
            product: jacket._id,
            variant: jacket.variants[0]._id,
            quantity: 1,
            price: jacket.variants[0].price
          }
        ],
        status: 'DELIVERED',
        shippingAddress: {
          street: '123 Main St',
          city: 'Boston',
          state: 'MA',
          country: 'US',
          zipCode: '02108'
        },
        paymentStatus: 'PAID',
        paymentMethod: 'CREDIT_CARD',
        subtotal: 499.98,
        tax: 49.99,
        shippingCost: 15.00,
        total: 564.97
      },
      // Pending order
      {
        customer: customer._id,
        items: [
          {
            product: headphones._id,
            variant: headphones.variants[1]._id,
            quantity: 1,
            price: headphones.variants[1].price
          }
        ],
        status: 'PENDING',
        shippingAddress: {
          street: '123 Main St',
          city: 'Boston',
          state: 'MA',
          country: 'US',
          zipCode: '02108'
        },
        paymentStatus: 'PENDING',
        paymentMethod: 'BANK_TRANSFER',
        subtotal: 199.99,
        tax: 20.00,
        shippingCost: 10.00,
        total: 229.99
      },
      // Cancelled order
      {
        customer: customer._id,
        items: [
          {
            product: jacket._id,
            variant: jacket.variants[2]._id,
            quantity: 1,
            price: jacket.variants[2].price
          }
        ],
        status: 'CANCELLED',
        shippingAddress: {
          street: '123 Main St',
          city: 'Boston',
          state: 'MA',
          country: 'US',
          zipCode: '02108'
        },
        paymentStatus: 'REFUNDED',
        paymentMethod: 'CREDIT_CARD',
        subtotal: 299.99,
        tax: 30.00,
        shippingCost: 10.00,
        total: 339.99,
        notes: 'Customer requested cancellation'
      }
    ];

    const createdOrders = [];
    for (const orderData of orders) {
      const order = new OrderModel(orderData);
      await order.save();
      createdOrders.push(order);
      logger.info(`Created order: ${order._id}`);
    }

    return createdOrders;
  } catch (error) {
    logger.error('Error seeding orders:', error);
    throw error;
  }
}