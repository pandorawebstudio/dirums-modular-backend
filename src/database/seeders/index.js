import mongoose from 'mongoose';
import { connectDatabase, closeDatabase } from '../../infrastructure/database/index.js';
import { seedUsers } from './user.seeder.js';
import { seedProducts } from './product.seeder.js';
import { seedCategories } from './category.seeder.js';
import { seedOrders } from './order.seeder.js';
import { seedCollections } from './collection.seeder.js';
import { logger } from '../../utils/logger.js';

async function seedDatabase() {
  try {
    await connectDatabase();
    logger.info('Starting database seeding...');

    // Clear existing data
    await clearDatabase();

    // Seed in order of dependencies
    const users = await seedUsers();
    const categories = await seedCategories();
    const products = await seedProducts(users, categories);
    const collections = await seedCollections(products);
    const orders = await seedOrders(users, products);

    logger.info('Database seeding completed successfully');
    await closeDatabase();
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    await closeDatabase();
    process.exit(1);
  }
}

async function clearDatabase() {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
  logger.info('Cleared existing database data');
}

// Run seeder if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedDatabase();
}

export { seedDatabase };