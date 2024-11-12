import { logger } from '../../utils/logger.js';

export class BaseService {
  constructor(repository) {
    this.repository = repository;
    this.logger = logger;
  }

  async findById(id) {
    try {
      const entity = await this.repository.findById(id);
      if (!entity) {
        throw new Error('Entity not found');
      }
      return entity;
    } catch (error) {
      this.logger.error(`Error in findById: ${error.message}`);
      throw error;
    }
  }

  async find(conditions, options) {
    try {
      return await this.repository.find(conditions, options);
    } catch (error) {
      this.logger.error(`Error in find: ${error.message}`);
      throw error;
    }
  }

  async create(data) {
    try {
      return await this.repository.create(data);
    } catch (error) {
      this.logger.error(`Error in create: ${error.message}`);
      throw error;
    }
  }

  async update(id, data) {
    try {
      const updated = await this.repository.update(id, data);
      if (!updated) {
        throw new Error('Entity not found');
      }
      return updated;
    } catch (error) {
      this.logger.error(`Error in update: ${error.message}`);
      throw error;
    }
  }

  async delete(id) {
    try {
      const deleted = await this.repository.delete(id);
      if (!deleted) {
        throw new Error('Entity not found');
      }
      return deleted;
    } catch (error) {
      this.logger.error(`Error in delete: ${error.message}`);
      throw error;
    }
  }
}