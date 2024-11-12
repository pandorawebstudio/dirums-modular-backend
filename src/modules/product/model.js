import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  media: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
    required: true
  },
  type: {
    type: String,
    enum: ['PRIMARY', 'GALLERY', 'VARIANT'],
    required: true
  },
  variantId: mongoose.Schema.Types.ObjectId,
  sortOrder: {
    type: Number,
    default: 0
  }
});

const variantSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true
  },
  name: String,
  price: {
    type: Number,
    required: true
  },
  compareAtPrice: Number,
  inventory: {
    type: Number,
    default: 0
  },
  media: [mediaSchema],
  attributes: {
    type: Map,
    of: String
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  media: [mediaSchema],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  tags: [String],
  variants: [variantSchema],
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'ARCHIVED', 'REJECTED'],
    default: 'DRAFT'
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approval: {
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING'
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    comment: String
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  requiresApproval: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
productSchema.index({ status: 1, vendor: 1 });
productSchema.index({ 'approval.status': 1 });
productSchema.index({ isPublished: 1, publishedAt: 1 });

export const ProductModel = mongoose.model('Product', productSchema);