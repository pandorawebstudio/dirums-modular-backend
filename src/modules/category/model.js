import mongoose from 'mongoose';

const categoryAttributeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'SELECT'],
    required: true
  },
  options: [String], // For SELECT type
  isRequired: {
    type: Boolean,
    default: false
  },
  defaultValue: mongoose.Schema.Types.Mixed,
  validation: {
    min: Number,
    max: Number,
    pattern: String,
    customValidator: String
  }
});

const categorySchema = new mongoose.Schema({
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
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  ancestors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  level: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
    default: 'ACTIVE'
  },
  attributes: [categoryAttributeSchema],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  image: {
    url: String,
    alt: String
  }
}, {
  timestamps: true
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ ancestors: 1 });
categorySchema.index({ status: 1 });

export const CategoryModel = mongoose.model('Category', categorySchema);