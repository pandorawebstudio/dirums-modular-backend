import { BaseService } from './base.service.js';
import { ExchangeRate, Discount } from '../../modules/pricing/model.js';
import { logger } from '../../utils/logger.js';

export class PricingService extends BaseService {
  constructor() {
    super(new Discount());
    this.exchangeRateModel = ExchangeRate;
    this.CURRENCY_API_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/inr.json';
  }

  async convertPrice(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;

    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * rate;

    if (fromCurrency === 'INR') {
      return this.adjustPriceFromINR(convertedAmount);
    }

    return convertedAmount;
  }

  adjustPriceFromINR(price) {
    let adjustedPrice = price;

    if (price < 1000) {
      adjustedPrice = price * 3;
    } else if (price >= 1000 && price < 3000) {
      adjustedPrice = price * 2;
    } else if (price >= 3000 && price < 5000) {
      adjustedPrice = price * 2;
    } else if (price >= 5000 && price <= 10000) {
      adjustedPrice = price * 1.4; // Increase by 40%
    } else if (price > 10000 && price <= 25000) {
      adjustedPrice = price * 1.3; // Increase by 30%
    } else if (price > 25000 && price <= 50000) {
      adjustedPrice = price * 1.2; // Increase by 20%
    } else if (price > 50000) {
      adjustedPrice = price * 1.15; // Increase by 15%
    }

    return adjustedPrice;
  }

  async getExchangeRate(fromCurrency, toCurrency) {
    const rate = await this.exchangeRateModel.findOne({
      baseCurrency: fromCurrency,
      targetCurrency: toCurrency
    });

    if (!rate || this.isRateExpired(rate)) {
      return this.updateExchangeRate(fromCurrency, toCurrency);
    }

    return rate.rate;
  }

  isRateExpired(rate) {
    const ONE_HOUR = 60 * 60 * 1000;
    return Date.now() - rate.lastUpdated > ONE_HOUR;
  }

  async updateExchangeRate(fromCurrency, toCurrency) {
    try {
      const response = await fetch(this.CURRENCY_API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const data = await response.json();
      const rates = data.inr;

      if (!rates[toCurrency.toLowerCase()]) {
        throw new Error(`Exchange rate not found for ${toCurrency}`);
      }

      const rate = fromCurrency === 'INR' 
        ? rates[toCurrency.toLowerCase()]
        : 1 / rates[fromCurrency.toLowerCase()];

      // Update or create exchange rate record
      await this.exchangeRateModel.findOneAndUpdate(
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
      logger.error(`Exchange rate update error: ${error.message}`);
      // Return last known rate or fallback rate
      const lastRate = await this.exchangeRateModel.findOne({
        baseCurrency: fromCurrency,
        targetCurrency: toCurrency
      });
      return lastRate?.rate || 1;
    }
  }

  async calculateDiscounts(items, appliedCodes, customer) {
    try {
      const activeDiscounts = await this.findActiveDiscounts(appliedCodes);
      const stackableDiscounts = [];
      let nonStackableDiscount = null;

      for (const discount of activeDiscounts) {
        if (!this.isDiscountValid(discount, items, customer)) continue;

        if (discount.stackable) {
          stackableDiscounts.push(discount);
        } else if (!nonStackableDiscount || 
                   this.getBetterNonStackableDiscount(
                     discount, 
                     nonStackableDiscount, 
                     items
                   )) {
          nonStackableDiscount = discount;
        }
      }

      return this.applyDiscounts(
        items,
        stackableDiscounts,
        nonStackableDiscount
      );
    } catch (error) {
      logger.error(`Discount calculation error: ${error.message}`);
      throw error;
    }
  }

  async findActiveDiscounts(codes) {
    const now = new Date();
    return this.repository.find({
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
    const { conditions } = discount;
    
    if (conditions.minPurchase) {
      const subtotal = items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0);
      if (subtotal < conditions.minPurchase) return false;
    }

    if (conditions.categories?.length) {
      const hasValidCategory = items.some(item =>
        conditions.categories.includes(item.product.category)
      );
      if (!hasValidCategory) return false;
    }

    if (conditions.products?.length) {
      const hasValidProduct = items.some(item =>
        conditions.products.includes(item.product._id)
      );
      if (!hasValidProduct) return false;
    }

    if (conditions.userGroups?.length) {
      if (!conditions.userGroups.includes(customer.group)) return false;
    }

    return true;
  }

  getBetterNonStackableDiscount(discount1, discount2, items) {
    const amount1 = this.calculateDiscountAmount(discount1, items);
    const amount2 = this.calculateDiscountAmount(discount2, items);
    return amount1 > amount2;
  }

  calculateDiscountAmount(discount, items) {
    const subtotal = items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0);

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

  applyDiscounts(items, stackableDiscounts, nonStackableDiscount) {
    let total = items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0);
    
    let discounts = [];

    if (nonStackableDiscount) {
      const amount = this.calculateDiscountAmount(nonStackableDiscount, items);
      discounts.push({
        id: nonStackableDiscount._id,
        code: nonStackableDiscount.code,
        amount
      });
      total -= amount;
    }

    for (const discount of stackableDiscounts) {
      const amount = this.calculateDiscountAmount(discount, items);
      discounts.push({
        id: discount._id,
        code: discount.code,
        amount
      });
      total -= amount;
    }

    return {
      original: total + discounts.reduce((sum, d) => sum + d.amount, 0),
      final: total,
      discounts
    };
  }
}