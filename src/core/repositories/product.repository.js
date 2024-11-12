import { BaseRepository } from './base.repository.js';
import { ProductModel } from '../../modules/product/model.js';

export class ProductRepository extends BaseRepository {
  constructor() {
    super(ProductModel);
  }

  async findWithFilters(filters, options) {
    const query = {};
    
    if (filters.status) query.status = filters.status;
    if (filters.vendorId) query.vendor = filters.vendorId;
    if (filters.categoryId) query.category = filters.categoryId;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }

    return this.find(query, {
      ...options,
      populate: 'category vendor'
    });
  }

  async findBySlug(slug) {
    return this.findOne({ slug }).populate('category vendor');
  }
}