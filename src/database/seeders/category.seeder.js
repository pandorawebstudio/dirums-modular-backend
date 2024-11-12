import { CategoryModel } from '../../modules/category/model.js';
import { logger } from '../../utils/logger.js';

export async function seedCategories() {
  try {
    const categories = [
      // Main categories
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and accessories',
        status: 'ACTIVE',
        attributes: [
          {
            name: 'Brand',
            type: 'SELECT',
            isRequired: true,
            options: ['Apple', 'Samsung', 'Sony', 'Other']
          },
          {
            name: 'Warranty',
            type: 'NUMBER',
            isRequired: true,
            validation: {
              min: 0,
              max: 24
            }
          }
        ]
      },
      {
        name: 'Apparel',
        slug: 'apparel',
        description: 'Clothing and accessories',
        status: 'ACTIVE',
        attributes: [
          {
            name: 'Size',
            type: 'SELECT',
            isRequired: true,
            options: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
          },
          {
            name: 'Color',
            type: 'SELECT',
            isRequired: true,
            options: ['Black', 'White', 'Red', 'Blue', 'Green']
          },
          {
            name: 'Material',
            type: 'TEXT',
            isRequired: true
          }
        ]
      },
      // Subcategories
      {
        name: 'Smartphones',
        slug: 'smartphones',
        description: 'Mobile phones and accessories',
        parent: null, // Will be set after parent category is created
        status: 'ACTIVE'
      },
      {
        name: 'Laptops',
        slug: 'laptops',
        description: 'Notebooks and laptops',
        parent: null, // Will be set after parent category is created
        status: 'ACTIVE'
      },
      // Edge cases
      {
        name: 'Archived Category',
        slug: 'archived-category',
        description: 'This category is no longer active',
        status: 'ARCHIVED'
      },
      {
        name: 'Empty Category',
        slug: 'empty-category',
        description: 'Category with no products',
        status: 'ACTIVE'
      }
    ];

    const createdCategories = [];
    for (const categoryData of categories) {
      const category = new CategoryModel(categoryData);
      await category.save();
      createdCategories.push(category);
      logger.info(`Created category: ${category.name}`);
    }

    // Set up parent-child relationships
    const electronics = createdCategories.find(c => c.name === 'Electronics');
    const smartphones = createdCategories.find(c => c.name === 'Smartphones');
    const laptops = createdCategories.find(c => c.name === 'Laptops');

    smartphones.parent = electronics._id;
    smartphones.ancestors = [electronics._id];
    smartphones.level = 1;

    laptops.parent = electronics._id;
    laptops.ancestors = [electronics._id];
    laptops.level = 1;

    await smartphones.save();
    await laptops.save();

    // Update parent with children
    electronics.children = [smartphones._id, laptops._id];
    await electronics.save();

    return createdCategories;
  } catch (error) {
    logger.error('Error seeding categories:', error);
    throw error;
  }
}