import { BaseService } from './base.service.js';
import { ShippingZone } from '../../modules/shipping/model.js';
import { logger } from '../../utils/logger.js';

export class ShippingService extends BaseService {
  constructor() {
    super(new ShippingZone());
  }

  async calculateShipping(items, destination) {
    try {
      const zone = await this.findApplicableZone(destination);
      if (!zone) {
        throw new Error('No shipping zone available for this destination');
      }

      const { totalWeight, totalDimensions } = this.calculatePackageMetrics(items);
      const applicableMethods = this.findApplicableMethods(zone, totalWeight, items);

      return applicableMethods.map(method => ({
        id: method._id,
        name: method.name,
        carrier: method.carrier,
        cost: this.calculateMethodCost(method, {
          weight: totalWeight,
          dimensions: totalDimensions,
          items
        })
      }));
    } catch (error) {
      logger.error(`Shipping calculation error: ${error.message}`);
      throw error;
    }
  }

  async findApplicableZone(destination) {
    const { country, region, postalCode } = destination;
    
    return this.repository.findOne({
      $or: [
        { countries: country },
        { regions: region },
        { postalCodes: { $regex: new RegExp(postalCode, 'i') } }
      ]
    });
  }

  calculatePackageMetrics(items) {
    return items.reduce((acc, item) => {
      const { weight, dimensions } = item.product;
      return {
        totalWeight: acc.totalWeight + (weight * item.quantity),
        totalDimensions: {
          length: Math.max(acc.totalDimensions.length, dimensions.length),
          width: Math.max(acc.totalDimensions.width, dimensions.width),
          height: acc.totalDimensions.height + (dimensions.height * item.quantity)
        }
      };
    }, { 
      totalWeight: 0,
      totalDimensions: { length: 0, width: 0, height: 0 }
    });
  }

  findApplicableMethods(zone, weight, items) {
    return zone.methods.filter(method => {
      const { minWeight, maxWeight } = method.conditions;
      return (!minWeight || weight >= minWeight) && 
             (!maxWeight || weight <= maxWeight);
    });
  }

  calculateMethodCost(method, { weight, dimensions, items }) {
    switch (method.rate) {
      case 'FLAT':
        return method.cost;
        
      case 'WEIGHT_BASED':
        return method.cost * weight;
        
      case 'PRICE_BASED': {
        const totalPrice = items.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0);
        return (method.cost / 100) * totalPrice;
      }
        
      case 'API':
        return this.getShippingApiRate(method, { weight, dimensions, items });
        
      default:
        throw new Error(`Unsupported rate type: ${method.rate}`);
    }
  }

  async getShippingApiRate(method, packageDetails) {
    // Implementation for real shipping carrier API calls
    return 0;
  }
}