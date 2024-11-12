import { UserModel } from '../../modules/user/model.js';
import { RBACService } from '../../modules/auth/rbac/rbac.service.js';
import { logger } from '../../utils/logger.js';

export async function seedUsers() {
  try {
    const rbacService = new RBACService();
    await rbacService.initialize();

    const users = [
      // Admin user
      {
        email: 'admin@example.com',
        password: 'admin123',
        name: 'System Admin',
        role: 'ADMIN',
        phoneNumber: '+12025550108'
      },
      // Vendor users with different business profiles
      {
        email: 'tech.vendor@example.com',
        password: 'vendor123',
        name: 'Tech Store',
        role: 'VENDOR',
        phoneNumber: '+12025550101',
        businessProfile: {
          name: 'Tech Store Inc',
          description: 'Premium electronics and gadgets',
          address: '123 Tech Street, Silicon Valley, CA 94025'
        }
      },
      {
        email: 'fashion.vendor@example.com',
        password: 'vendor123',
        name: 'Fashion Boutique',
        role: 'VENDOR',
        phoneNumber: '+12025550102',
        businessProfile: {
          name: 'Fashion Boutique LLC',
          description: 'Trendy fashion and accessories',
          address: '456 Fashion Ave, New York, NY 10018'
        }
      },
      // Staff users with different responsibilities
      {
        email: 'support@example.com',
        password: 'staff123',
        name: 'Support Staff',
        role: 'STAFF',
        phoneNumber: '+12025550103'
      },
      {
        email: 'inventory@example.com',
        password: 'staff123',
        name: 'Inventory Manager',
        role: 'STAFF',
        phoneNumber: '+12025550104'
      },
      // Regular customers with varied profiles
      {
        email: 'john.doe@example.com',
        password: 'customer123',
        name: 'John Doe',
        role: 'CUSTOMER',
        phoneNumber: '+12025550105'
      },
      {
        email: 'jane.smith@example.com',
        password: 'customer123',
        name: 'Jane Smith',
        role: 'CUSTOMER',
        phoneNumber: '+12025550106'
      },
      // Edge cases
      {
        email: 'inactive.vendor@example.com',
        password: 'vendor123',
        name: 'Inactive Vendor',
        role: 'VENDOR',
        phoneNumber: '+12025550107',
        businessProfile: {
          name: 'Inactive Store',
          status: 'SUSPENDED'
        }
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const user = new UserModel(userData);
      await user.save();
      createdUsers.push(user);
      logger.info(`Created user: ${user.email} (${user.role})`);
    }

    return createdUsers;
  } catch (error) {
    logger.error('Error seeding users:', error);
    throw error;
  }
}