import { CollectionModel } from './model.js';
import { ProductModel } from '../product/model.js';
import { logger } from '../../utils/logger.js';

export class CollectionService {
  async createCollection(data) {
    try {
      const handle = this.generateHandle(data.title);
      const collection = new CollectionModel({
        ...data,
        handle,
        products: data.type === 'MANUAL' ? data.products : []
      });

      if (data.type === 'AUTOMATIC') {
        await this.updateAutomaticCollection(collection);
      }

      return collection.save();
    } catch (error) {
      logger.error(`Collection creation error: ${error.message}`);
      throw error;
    }
  }

  async updateCollection(id, data) {
    try {
      const collection = await CollectionModel.findById(id);
      if (!collection) throw new Error('Collection not found');

      if (data.title) {
        data.handle = this.generateHandle(data.title);
      }

      Object.assign(collection, data);

      if (collection.type === 'AUTOMATIC') {
        await this.updateAutomaticCollection(collection);
      }

      return collection.save();
    } catch (error) {
      logger.error(`Collection update error: ${error.message}`);
      throw error;
    }
  }

  async getCollection(id) {
    try {
      const collection = await CollectionModel.findById(id)
        .populate('products');
      if (!collection) throw new Error('Collection not found');
      return collection;
    } catch (error) {
      logger.error(`Get collection error: ${error.message}`);
      throw error;
    }
  }

  async getCollections({ published, limit = 20, offset = 0 }) {
    try {
      const query = {};
      if (typeof published === 'boolean') {
        query.isPublished = published;
      }

      return CollectionModel.find(query)
        .populate('products')
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.error(`Get collections error: ${error.message}`);
      throw error;
    }
  }

  async deleteCollection(id) {
    try {
      const collection = await CollectionModel.findById(id);
      if (!collection) throw new Error('Collection not found');
      await collection.remove();
      return true;
    } catch (error) {
      logger.error(`Delete collection error: ${error.message}`);
      throw error;
    }
  }

  async addProductToCollection(collectionId, productId) {
    try {
      const collection = await CollectionModel.findById(collectionId);
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
      const collection = await CollectionModel.findById(collectionId);
      if (!collection) throw new Error('Collection not found');

      if (collection.type !== 'MANUAL') {
        throw new Error('Cannot manually remove products from automatic collections');
      }

      collection.products = collection.products.filter(id => 
        id.toString() !== productId.toString()
      );
      
      return collection.save();
    } catch (error) {
      logger.error(`Remove product from collection error: ${error.message}`);
      throw error;
    }
  }

  async updateAutomaticCollection(collection) {
    try {
      const matchingProducts = await this.findMatchingProducts(collection.ruleGroups);
      collection.products = matchingProducts.map(p => p._id);
      return collection.save();
    } catch (error) {
      logger.error(`Update automatic collection error: ${error.message}`);
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
        return { [this.getFieldPath(field)]: { $gt: parseFloat(value) } };
      case 'LESS_THAN':
        return { [this.getFieldPath(field)]: { $lt: parseFloat(value) } };
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
}