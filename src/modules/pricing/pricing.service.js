import { DiscountModel, ExchangeRateModel } from './model.js';
import { logger } from '../../utils/logger.js';

export class PricingService {
  async convertPrice(amount, fromCurrency, toCurrency) {
    try {
      if (fromCurrency === toCurrency) return amount;

      const rate = await this.getExchangeRate(fromCurrency, toCurrency);
      return amount * rate;
    } catch (error) {
      logger.error(`Price conversion error: ${error.message}`);
      throw error;
    }
  }

  async getExchangeRate(fromCurrency, toCurrency) {
    try {
      const rate = await ExchangeRateModel.findOne({
        baseCurrency: fromCurrency,
        targetCurrency: toCurrency
      });

      if (!rate || this.isRateExpired(rate)) {
        return this.updateExchangeRate(fromCurrency, toCurrency);
      }

      return rate.rate;
    } catch (error) {
      logger.error(`Get exchange rate error: ${error.message}`);
      throw error;
    }
  }

  async updateExchangeRate(fromCurrency, toCurrency) {
    try {
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const data = await response.json();
      const rate = data.rates[toCurrency];

      if (!rate) {
        throw new Error(`Exchange rate not found for ${toCurrency}`);
      }

      await ExchangeRateModel.findOneAndUpdate(
        {
          baseCurrency: fromCurrency,
          targetCurrency: toCurrency
        },
        {
          rate,
          lastUpdated: new Date()
        },
        { upsert: true }
      );

      return rate;
    } catch (error) {
      logger.error(`Update exchange rate error: ${error.message}`);
      throw error;
    }
  }

  isRateExpired(rate) {
    const ONE_HOUR = 60 * 60 * 1000;
    return Date.now() - rate.lastUpdated > ONE_HOUR;
  }

  async calculateDiscounts(items, appliedCodes, customer) {
    try {
      const activeDiscounts = await this.findActiveDiscounts(appliedCodes);
      let totalDiscount = 0;

      for (const discount of activeDiscounts) {
        if (this.isDiscountValid(discount, items, customer)) {
          totalDiscount += this.calculateDiscountAmount(discount, items);
        }
      }

      return {
        original: this.calculateSubtotal(items),
        discount: totalDiscount,
        final: this.calculateSubtotal(items) - totalDiscount
      };
    } catch (error) {
      logger.error(`Calculate discounts error: ${error.message}`);
      throw error;
    }
  }

  async findActiveDiscounts(codes) {
    const now = new Date();
    return DiscountModel.find({
      $or: [
        { code: { $in: codes } },
        { code: null } // Automatic discounts
      ],
      status: 'ACTIVE',
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { usageLimit: null },
        { usageCount: { $lt: '$usageLimit' } }
      ]
    });
  }

  isDiscountValid(discount, items, customer) {
    // Check minimum purchase amount
    if (discount.minPurchase) {
      const subtotal = this.calculateSubtotal(items);
      if (subtotal < discount.minPurchase) return false;
    }

    // Check category restrictions
    if (discount.conditions?.categories?.length) {
      const hasValidCategory = items.some(item =>
        discount.conditions.categories.includes(item.product.category)
      );
      if (!hasValidCategory) return false;
    }

    // Check product restrictions
    if (discount.conditions?.products?.length) {
      const hasValidProduct = items.some(item =>
        discount.conditions.products.includes(item.product._id)
      );
      if (!hasValidProduct) return false;
    }

    // Check customer group restrictions
    if (discount.conditions?.customerGroups?.length) {
      if (!discount.conditions.customerGroups.includes(customer.group)) {
        return false;
      }
    }

    return true;
  }

  calculateDiscountAmount(discount, items) {
    const subtotal = this.calculateSubtotal(items);

    switch (discount.type) {
      case 'PERCENTAGE':
        return (discount.value / 100) * subtotal;
      
      case 'FIXED':
        return Math.min(discount.value, subtotal);
      
      case 'BUY_X_GET_Y':
        return this.calculateBuyXGetYDiscount(discount, items);
      
      default:
        return 0;
    }
  }

  calculateBuyXGetYDiscount(discount, items) {
    const { buyQuantity, getQuantity, targetProduct } = discount.conditions;
    const eligibleItems = items.filter(item => 
      !targetProduct || item.product._id.equals(targetProduct)
    );

    let totalDiscount = 0;
    for (const item of eligibleItems) {
      const sets = Math.floor(item.quantity / (buyQuantity + getQuantity));
      const discountPerSet = item.price * getQuantity;
      totalDiscount += sets * discountPerSet;
    }

    return totalDiscount;
  }

  calculateSubtotal(items) {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
}