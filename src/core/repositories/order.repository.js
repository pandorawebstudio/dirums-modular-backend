import { BaseRepository } from './base.repository.js';
import { OrderModel } from '../../modules/order/model.js';

export class OrderRepository extends BaseRepository {
  constructor() {
    super(OrderModel);
  }

  async findWithFilters(filters, options) {
    const query = {};
    
    if (filters.status) query.status = filters.status;
    if (filters.customerId) query.customer = filters.customerId;
    if (filters.vendorId) {
      query['items.product'] = { $in: filters.vendorProducts };
    }

    return this.find(query, {
      ...options,
      populate: 'customer items.product items.variant'
    });
  }

  async findByCustomer(customerId, options) {
    return this.find(
      { customer: customerId },
      {
        ...options,
        populate: 'items.product items.variant'
      }
    );
  }
}