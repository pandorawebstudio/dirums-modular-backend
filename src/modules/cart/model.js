import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  selectedOptions: {
    type: Map,
    of: String
  },
  notes: String
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [cartItemSchema],
  appliedCoupons: [{
    code: String,
    discountAmount: Number,
    type: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED']
    }
  }],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ lastActivity: 1 });

export const CartModel = mongoose.model('Cart', cartSchema);