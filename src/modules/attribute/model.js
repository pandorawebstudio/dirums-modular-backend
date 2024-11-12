import mongoose from 'mongoose';

const attributeValidationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['RANGE', 'PATTERN', 'ENUM', 'CUSTOM'],
    required: true
  },
  config: {
    min: Number,
    max: Number,
    pattern: String,
    values: [String],
    customValidator: String
  }
});

const attributeOptionSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true
  },
  label: String,
  metadata: Map
});

const attributeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'SELECT', 'MULTI_SELECT', 'COLOR', 'FILE'],
    required: true
  },
  group: {
    type: String,
    required: true
  },
  description: String,
  isRequired: {
    type: Boolean,
    default: false
  },
  isUnique: {
    type: Boolean,
    default: false
  },
  isSearchable: {
    type: Boolean,
    default: true
  },
  isFilterable: {
    type: Boolean,
    default: true
  },
  validation: attributeValidationSchema,
  options: [attributeOptionSchema],
  defaultValue: mongoose.Schema.Types.Mixed,
  unit: String,
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true
});

// Indexes
attributeSchema.index({ code: 1 });
attributeSchema.index({ group: 1 });
attributeSchema.index({ status: 1 });

export const AttributeModel = mongoose.model('Attribute', attributeSchema);