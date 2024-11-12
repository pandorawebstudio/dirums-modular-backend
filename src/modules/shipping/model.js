import mongoose from 'mongoose';

const shippingZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  countries: [String],
  regions: [String],
  postalCodes: [String],
  methods: [{
    name: String,
    carrier: String,
    rate: {
      type: String,
      enum: ['FLAT', 'WEIGHT_BASED', 'PRICE_BASED', 'API'],
      required: true
    },
    cost: Number,
    conditions: {
      minWeight: Number,
      maxWeight: Number,
      minPrice: Number,
      maxPrice: Number
    },
    apiConfig: {
      provider: String,
      credentials: Map,
      endpoint: String
    }
  }]
});

const taxRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  country: String,
  region: String,
  postalCode: String,
  rate: {
    type: Number,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  priority: {
    type: Number,
    default: 0
  }
});

export const ShippingZone = mongoose.model('ShippingZone', shippingZoneSchema);
export const TaxRule = mongoose.model('TaxRule', taxRuleSchema);