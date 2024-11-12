import { BaseService } from './base.service.js';
import { TaxRule } from '../../modules/shipping/model.js';
import { logger } from '../../utils/logger.js';

export class TaxService extends BaseService {
  constructor() {
    super(new TaxRule());
  }

  async calculateTax(items, { country, region, postalCode }) {
    try {
      const applicableRules = await this.findApplicableRules({ 
        country, 
        region, 
        postalCode 
      });

      return items.reduce((acc, item) => {
        const rule = this.findHighestPriorityRule(
          applicableRules,
          item.product.category
        );
        
        if (!rule) return acc;

        const itemTotal = item.price * item.quantity;
        const taxAmount = (rule.rate / 100) * itemTotal;

        return acc + taxAmount;
      }, 0);
    } catch (error) {
      logger.error(`Tax calculation error: ${error.message}`);
      throw error;
    }
  }

  async findApplicableRules({ country, region, postalCode }) {
    return this.repository.find({
      $or: [
        { country, region, postalCode },
        { country, region, postalCode: null },
        { country, region: null, postalCode: null }
      ]
    }).sort({ priority: -1 });
  }

  findHighestPriorityRule(rules, category) {
    return rules.find(rule => 
      !rule.category || rule.category.equals(category)
    );
  }

  async validateVAT(vatNumber, country) {
    // Implementation for VAT number validation
    return true;
  }
}