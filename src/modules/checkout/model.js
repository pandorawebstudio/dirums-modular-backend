import mongoose from 'mongoose';

const checkoutSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart',
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'ABANDONED'],
    default: 'PENDING'
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    phone: String
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    phone: String
  },
  paymentMethod: {
    type: String,
    enum: ['CREDIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'COD']
  },
  paymentDetails: {
    provider: String,
    transactionId: String,
    status: String,
    amount: Number,
    currency: String,
    metadata: Map
  },
  summary: {
    subtotal: Number,
    shipping: Number,
    tax: Number,
    discount: Number,
    total: Number
  },
  notes: String,
  expiresAt: Date
}, {
  timestamps: true
});

// Indexes
checkoutSessionSchema.index({ user: 1 });
checkoutSessionSchema.index({ status: 1 });
checkoutSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const CheckoutSession = mongoose.model('CheckoutSession', checkoutSessionSchema);