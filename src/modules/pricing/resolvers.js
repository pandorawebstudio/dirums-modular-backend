import { PricingService } from './pricing.service.js';
import { requirePermission } from '../auth/middleware/rbac.middleware.js';
import { logger } from '../../utils/logger.js';

const pricingService = new PricingService();

export const pricingResolvers = {
  Query: {
    discounts: async (_, { status, limit = 20, offset = 0 }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      await requirePermission('MANAGE_DISCOUNTS')(auth);
      
      const query = {};
      if (status) query.status = status;

      return DiscountModel.find(query)
        .populate('conditions.categories conditions.products conditions.targetProduct')
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 });
    },

    discount: async (_, { id }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      await requirePermission('MANAGE_DISCOUNTS')(auth);
      
      return DiscountModel.findById(id)
        .populate('conditions.categories conditions.products conditions.targetProduct');
    },

    validateDiscount: async (_, { code, items }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');

      try {
        const discount = await DiscountModel.findOne({ code, status: 'ACTIVE' });
        if (!discount) {
          return {
            isValid: false,
            error: 'Invalid discount code'
          };
        }

        const isValid = await pricingService.isDiscountValid(discount, items, auth.user);
        return {
          isValid,
          discount: isValid ? discount : null,
          error: isValid ? null : 'Discount conditions not met'
        };
      } catch (error) {
        logger.error(`Validate discount error: ${error.message}`);
        return {
          isValid: false,
          error: error.message
        };
      }
    },

    exchangeRate: async (_, { fromCurrency, toCurrency }) => {
      const rate = await pricingService.getExchangeRate(fromCurrency, toCurrency);
      return {
        baseCurrency: fromCurrency,
        targetCurrency: toCurrency,
        rate,
        lastUpdated: new Date()
      };
    }
  },

  Mutation: {
    createDiscount: async (_, { input }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      await requirePermission('MANAGE_DISCOUNTS')(auth);
      
      const discount = new DiscountModel(input);
      return discount.save();
    },

    updateDiscount: async (_, { id, input }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      await requirePermission('MANAGE_DISCOUNTS')(auth);
      
      return DiscountModel.findByIdAndUpdate(id, input, { new: true })
        .populate('conditions.categories conditions.products conditions.targetProduct');
    },

    deleteDiscount: async (_, { id }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      await requirePermission('MANAGE_DISCOUNTS')(auth);
      
      await DiscountModel.findByIdAndDelete(id);
      return true;
    },

    applyDiscount: async (_, { code }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      const cartService = fastify.cartService;
      return cartService.applyDiscount(auth.user.id, code);
    },

    removeDiscount: async (_, { code }, { auth }) => {
      if (!auth.user) throw new Error('Not authenticated');
      
      const cartService = fastify.cartService;
      return cartService.removeDiscount(auth.user.id, code);
    }
  }
};