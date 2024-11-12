import { ProductModel } from '../../modules/product/model.js';
import { logger } from '../../utils/logger.js';

export async function seedProducts(users, categories) {
  try {
    const techVendor = users.find(u => u.email === 'tech.vendor@example.com');
    const fashionVendor = users.find(u => u.email === 'fashion.vendor@example.com');
    const inactiveVendor = users.find(u => u.email === 'inactive.vendor@example.com');

    const products = [
      // Tech products
      {
        name: 'Premium Wireless Headphones',
        slug: 'premium-wireless-headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        vendor: techVendor._id,
        category: categories.find(c => c.name === 'Electronics')._id,
        status: 'ACTIVE',
        isPublished: true,
        tags: ['electronics', 'audio', 'wireless'],
        variants: [
          {
            sku: 'HEAD-BLK-001',
            name: 'Black',
            price: 199.99,
            inventory: 50,
            attributes: {
              color: 'Black',
              connectivity: 'Bluetooth 5.0'
            }
          },
          {
            sku: 'HEAD-WHT-001',
            name: 'White',
            price: 199.99,
            inventory: 30,
            attributes: {
              color: 'White',
              connectivity: 'Bluetooth 5.0'
            }
          }
        ]
      },
      // Fashion products
      {
        name: 'Classic Leather Jacket',
        slug: 'classic-leather-jacket',
        description: 'Timeless leather jacket for all seasons',
        vendor: fashionVendor._id,
        category: categories.find(c => c.name === 'Apparel')._id,
        status: 'ACTIVE',
        isPublished: true,
        tags: ['fashion', 'outerwear', 'leather'],
        variants: [
          {
            sku: 'JAC-BLK-S',
            name: 'Black - Small',
            price: 299.99,
            inventory: 20,
            attributes: {
              color: 'Black',
              size: 'S'
            }
          },
          {
            sku: 'JAC-BLK-M',
            name: 'Black - Medium',
            price: 299.99,
            inventory: 25,
            attributes: {
              color: 'Black',
              size: 'M'
            }
          },
          {
            sku: 'JAC-BLK-L',
            name: 'Black - Large',
            price: 299.99,
            inventory: 15,
            attributes: {
              color: 'Black',
              size: 'L'
            }
          }
        ]
      },
      // Edge cases
      {
        name: 'Out of Stock Product',
        slug: 'out-of-stock-product',
        description: 'Product with zero inventory',
        vendor: techVendor._id,
        category: categories.find(c => c.name === 'Electronics')._id,
        status: 'ACTIVE',
        isPublished: true,
        variants: [
          {
            sku: 'OUT-STK-001',
            name: 'Default',
            price: 49.99,
            inventory: 0
          }
        ]
      },
      {
        name: 'Pending Approval Product',
        slug: 'pending-approval-product',
        description: 'Product waiting for admin approval',
        vendor: fashionVendor._id,
        category: categories.find(c => c.name === 'Apparel')._id,
        status: 'PENDING_APPROVAL',
        isPublished: false,
        variants: [
          {
            sku: 'PEND-001',
            name: 'Default',
            price: 79.99,
            inventory: 100
          }
        ]
      },
      {
        name: 'Inactive Vendor Product',
        slug: 'inactive-vendor-product',
        description: 'Product from suspended vendor',
        vendor: inactiveVendor._id,
        category: categories.find(c => c.name === 'Electronics')._id,
        status: 'ARCHIVED',
        isPublished: false,
        variants: [
          {
            sku: 'INACT-001',
            name: 'Default',
            price: 29.99,
            inventory: 5
          }
        ]
      }
    ];

    const createdProducts = [];
    for (const productData of products) {
      const product = new ProductModel(productData);
      await product.save();
      createdProducts.push(product);
      logger.info(`Created product: ${product.name}`);
    }

    return createdProducts;
  } catch (error) {
    logger.error('Error seeding products:', error);
    throw error;
  }
}