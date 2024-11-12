import { CollectionModel } from '../../modules/collection/model.js';
import { logger } from '../../utils/logger.js';

export async function seedCollections(products) {
  try {
    const collections = [
      // Manual collection
      {
        title: 'Featured Products',
        handle: 'featured-products',
        description: 'Hand-picked selection of our best products',
        type: 'MANUAL',
        products: products
          .filter(p => p.status === 'ACTIVE')
          .slice(0, 2)
          .map(p => p._id),
        sortOrder: {
          field: 'MANUAL',
          direction: 'ASC'
        },
        isPublished: true
      },
      // Automatic collection
      {
        title: 'Premium Products',
        handle: 'premium-products',
        description: 'Products priced over $200',
        type: 'AUTOMATIC',
        ruleGroups: [
          {
            operator: 'AND',
            conditions: [
              {
                field: 'PRICE',
                operator: 'GREATER_THAN',
                value: '200'
              },
              {
                field: 'STATUS',
                operator: 'EQUALS',
                value: 'ACTIVE'
              }
            ]
          }
        ],
        sortOrder: {
          field: 'PRICE',
          direction: 'DESC'
        },
        isPublished: true
      },
      // Edge case: Unpublished collection
      {
        title: 'Coming Soon',
        handle: 'coming-soon',
        description: 'Upcoming products',
        type: 'MANUAL',
        products: [],
        isPublished: false
      }
    ];

    const createdCollections = [];
    for (const collectionData of collections) {
      const collection = new CollectionModel(collectionData);
      await collection.save();
      createdCollections.push(collection);
      logger.info(`Created collection: ${collection.title}`);
    }

    return createdCollections;
  } catch (error) {
    logger.error('Error seeding collections:', error);
    throw error;
  }
}