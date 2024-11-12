import mongoose from 'mongoose';

const conditionSchema = new mongoose.Schema({
  field: {
    type: String,
    enum: ['PRICE', 'TITLE', 'TAG', 'VENDOR', 'TYPE', 'INVENTORY', 'WEIGHT'],
    required: true
  },
  operator: {
    type: String,
    enum: ['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'CONTAINS', 'NOT_CONTAINS', 'STARTS_WITH', 'ENDS_WITH'],
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
});

const ruleGroupSchema = new mongoose.Schema({
  operator: {
    type: String,
    enum: ['AND', 'OR'],
    default: 'AND'
  },
  conditions: [conditionSchema]
});

const collectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  handle: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  image: {
    url: String,
    alt: String
  },
  type: {
    type: String,
    enum: ['MANUAL', 'AUTOMATIC'],
    required: true
  },
  ruleGroups: [ruleGroupSchema],
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  sortOrder: {
    field: {
      type: String,
      enum: ['TITLE', 'CREATED_AT', 'PRICE', 'BEST_SELLING', 'MANUAL'],
      default: 'MANUAL'
    },
    direction: {
      type: String,
      enum: ['ASC', 'DESC'],
      default: 'ASC'
    }
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date
}, {
  timestamps: true
});

// Indexes
collectionSchema.index({ handle: 1 });
collectionSchema.index({ 'products': 1 });
collectionSchema.index({ isPublished: 1, publishedAt: 1 });

export const CollectionModel = mongoose.model('Collection', collectionSchema);