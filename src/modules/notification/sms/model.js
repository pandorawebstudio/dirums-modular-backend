import mongoose from 'mongoose';

const smsProviderConfigSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  provider: {
    type: String,
    enum: ['TWILIO', 'MSG91', 'FIREBASE'],
    required: true
  },
  credentials: {
    type: Map,
    of: String,
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  },
  rateLimits: {
    maxPerMinute: Number,
    maxPerHour: Number,
    maxPerDay: Number
  }
});

const smsTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['VERIFICATION', 'NOTIFICATION', 'MARKETING', 'TRANSACTIONAL'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  variables: [{
    name: String,
    description: String,
    required: Boolean
  }],
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  }
});

const smsLogSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true
  },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SMSTemplate'
  },
  to: {
    type: String,
    required: true
  },
  content: String,
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'FAILED', 'DELIVERED'],
    default: 'PENDING'
  },
  error: String,
  metadata: Map
}, {
  timestamps: true
});

// Indexes
smsProviderConfigSchema.index({ provider: 1 });
smsProviderConfigSchema.index({ isDefault: 1 });
smsTemplateSchema.index({ type: 1 });
smsLogSchema.index({ status: 1 });
smsLogSchema.index({ createdAt: 1 });

export const SMSProvider = mongoose.model('SMSProvider', smsProviderConfigSchema);
export const SMSTemplate = mongoose.model('SMSTemplate', smsTemplateSchema);
export const SMSLog = mongoose.model('SMSLog', smsLogSchema);