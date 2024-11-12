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
  value: Number,
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
    userGroups: [String]
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'],
    default: 'ACTIVE'
  }
});

const rewardPointSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  points: {
    type: Number,
    default: 0
  },
  history: [{
    action: {
      type: String,
      enum: ['EARNED', 'SPENT', 'EXPIRED', 'ADJUSTED'],
      required: true
    },
    points: Number,
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    description: String,
    date: {
      type: Date,
      default: Date.now
    }
  }]
});

export const ExchangeRate = mongoose.model('ExchangeRate', exchangeRateSchema);
export const Discount = mongoose.model('Discount', discountSchema);
export const RewardPoint = mongoose.model('RewardPoint', rewardPointSchema);