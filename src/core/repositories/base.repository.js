import mongoose from 'mongoose';

export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id) {
    return this.model.findById(id);
  }

  async findOne(conditions) {
    return this.model.findOne(conditions);
  }

  async find(conditions = {}, options = {}) {
    const { skip = 0, limit = 50, sort = { createdAt: -1 }, populate } = options;
    let query = this.model.find(conditions).skip(skip).limit(limit).sort(sort);
    
    if (populate) {
      query = query.populate(populate);
    }
    
    return query.exec();
  }

  async create(data) {
    const entity = new this.model(data);
    return entity.save();
  }

  async update(id, data) {
    return this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return this.model.findByIdAndDelete(id);
  }

  async count(conditions = {}) {
    return this.model.countDocuments(conditions);
  }
}