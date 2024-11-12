import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['IMAGE', 'VIDEO', 'DOCUMENT'],
    required: true
  },
  url: String,
  metadata: {
    width: Number,
    height: Number,
    duration: Number,
    thumbnails: [{
      key: String,
      url: String,
      width: Number,
      height: Number
    }]
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'READY', 'ERROR'],
    default: 'PENDING'
  },
  error: String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
mediaSchema.index({ key: 1 });
mediaSchema.index({ uploadedBy: 1 });
mediaSchema.index({ type: 1 });
mediaSchema.index({ status: 1 });

export const MediaModel = mongoose.model('Media', mediaSchema);