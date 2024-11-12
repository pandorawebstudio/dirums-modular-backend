import mongoose from 'mongoose';

const exchangeRateSchema = new mongoose.Schema({
  baseCurrency: {
    type: String,
    required: true
  },
  targetCurrency: {
    type: String,
    required: true
  },
  rate: {
    type: Number,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const discountSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    sparse: true
  },
  type: {
    type: String,
    enum: ['PERCENTAGE', 'FIXED', 'BUY_X_GET_Y'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  minPurchase: Number,
  maxDiscount: Number,
  startDate: Date,
  endDate: Date,
  usageLimit: Number,
  usageCount: {
    type: Number,
    default: 0
  },
  conditions: {
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    customerGroups: [String],
    buyQuantity: Number,
    getQuantity: Number,
    targetProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true
});

// Indexes
exchangeRateSchema.index({ baseCurrency: 1, targetCurrency: 1 }, { unique: true });
exchangeRateSchema.index({ lastUpdated: 1 });
discountSchema.index({ code: 1 });
discountSchema.index({ status: 1 });
discountSchema.index({ startDate: 1, endDate: 1 });

export const ExchangeRateModel = mongoose.model('ExchangeRate', exchangeRateSchema);
export const DiscountModel = mongoose.model('Discount', discountSchema);