import { BaseService } from './base.service.js';
import { CollectionModel } from '../../modules/collection/model.js';
import { ProductModel } from '../../modules/product/model.js';
import { logger } from '../../utils/logger.js';

export class CollectionService extends BaseService {
  constructor() {
    super(CollectionModel);
  }

  async createCollection(data) {
    try {
      const handle = this.generateHandle(data.title);
      const collection = await this.create({
        ...data,
        handle,
        products: data.type === 'MANUAL' ? data.products : []
      });

      if (data.type === 'AUTOMATIC') {
        await this.updateAutomaticCollection(collection);
      }

      return collection;
    } catch (error) {
      logger.error(`Collection creation error: ${error.message}`);
      throw error;
    }
  }

  async updateCollection(id, data) {
    try {
      const collection = await this.findById(id);
      if (!collection) throw new Error('Collection not found');

      if (data.title) {
        data.handle = this.generateHandle(data.title);
      }

      const updated = await this.update(id, data);

      if (updated.type === 'AUTOMATIC') {
        await this.updateAutomaticCollection(updated);
      }

      return updated;
    } catch (error) {
      logger.error(`Collection update error: ${error.message}`);
      throw error;
    }
  }

  async updateAutomaticCollection(collection) {
    try {
      const matchingProducts = await this.findMatchingProducts(collection.ruleGroups);
      
      collection.products = matchingProducts.map(p => p._id);
      await collection.save();
      
      return collection;
    } catch (error) {
      logger.error(`Automatic collection update error: ${error.message}`);
      throw error;
    }
  }

  async findMatchingProducts(ruleGroups) {
    const query = {
      $and: ruleGroups.map(group => ({
        [group.operator === 'AND' ? '$and' : '$or']: group.conditions.map(condition => 
          this.buildConditionQuery(condition)
        )
      }))
    };

    return ProductModel.find(query);
  }

  buildConditionQuery(condition) {
    const { field, operator, value } = condition;

    switch (operator) {
      case 'EQUALS':
        return { [this.getFieldPath(field)]: value };
      
      case 'NOT_EQUALS':
        return { [this.getFieldPath(field)]: { $ne: value } };
      
      case 'GREATER_THAN':
        return { [this.getFieldPath(field)]: { $gt: value } };
      
      case 'LESS_THAN':
        return { [this.getFieldPath(field)]: { $lt: value } };
      
      case 'CONTAINS':
        return { [this.getFieldPath(field)]: { $regex: value, $options: 'i' } };
      
      case 'NOT_CONTAINS':
        return { [this.getFieldPath(field)]: { $not: { $regex: value, $options: 'i' } } };
      
      case 'STARTS_WITH':
        return { [this.getFieldPath(field)]: { $regex: `^${value}`, $options: 'i' } };
      
      case 'ENDS_WITH':
        return { [this.getFieldPath(field)]: { $regex: `${value}$`, $options: 'i' } };
      
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }

  getFieldPath(field) {
    switch (field) {
      case 'PRICE':
        return 'variants.price';
      case 'INVENTORY':
        return 'variants.inventory';
      case 'WEIGHT':
        return 'variants.weight';
      default:
        return field.toLowerCase();
    }
  }

  generateHandle(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async addProductToCollection(collectionId, productId) {
    try {
      const collection = await this.findById(collectionId);
      if (!collection) throw new Error('Collection not found');

      if (collection.type !== 'MANUAL') {
        throw new Error('Cannot manually add products to automatic collections');
      }

      if (!collection.products.includes(productId)) {
        collection.products.push(productId);
        await collection.save();
      }

      return collection;
    } catch (error) {
      logger.error(`Add product to collection error: ${error.message}`);
      throw error;
    }
  }

  async removeProductFromCollection(collectionId, productId) {
    try {
      const collection = await this.findById(collectionId);
      if (!collection) throw new Error('Collection not found');

      if (collection.type !== 'MANUAL') {
        throw new Error('Cannot manually remove products from automatic collections');
      }

      collection.products = collection.products.filter(
        id => id.toString() !== productId.toString()
      );
      await collection.save();

      return collection;
    } catch (error) {
      logger.error(`Remove product from collection error: ${error.message}`);
      throw error;
    }
  }

  async reorderProducts(collectionId, productIds) {
    try {
      const collection = await this.findById(collectionId);
      if (!collection) throw new Error('Collection not found');

      if (collection.type !== 'MANUAL') {
        throw new Error('Cannot reorder products in automatic collections');
      }

      collection.products = productIds;
      await collection.save();

      return collection;
    } catch (error) {
      logger.error(`Reorder products error: ${error.message}`);
      throw error;
    }
  }

  async getCollectionProducts(collectionId, { limit = 20, offset = 0, sort }) {
    try {
      const collection = await this.findById(collectionId);
      if (!collection) throw new Error('Collection not found');

      const sortOptions = this.buildSortOptions(collection.sortOrder, sort);

      return ProductModel
        .find({ _id: { $in: collection.products } })
        .sort(sortOptions)
        .skip(offset)
        .limit(limit);
    } catch (error) {
      logger.error(`Get collection products error: ${error.message}`);
      throw error;
    }
  }

  buildSortOptions(defaultSort, overrideSort = {}) {
    const sort = { ...defaultSort, ...overrideSort };
    
    switch (sort.field) {
      case 'TITLE':
        return { title: sort.direction === 'DESC' ? -1 : 1 };
      case 'CREATED_AT':
        return { createdAt: sort.direction === 'DESC' ? -1 : 1 };
      case 'PRICE':
        return { 'variants.price': sort.direction === 'DESC' ? -1 : 1 };
      case 'BEST_SELLING':
        return { soldCount: sort.direction === 'DESC' ? -1 : 1 };
      case 'MANUAL':
      default:
        return {};
    }
  }
}