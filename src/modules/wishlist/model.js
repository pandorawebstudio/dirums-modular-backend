import mongoose from 'mongoose';

const wishlistItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant: {
    type: mongoose.Schema.Types.ObjectId
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  notes: String,
  priority: {
    type: Number,
    default: 0
  }
});

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    default: 'Default Wishlist'
  },
  items: [wishlistItemSchema],
  isPublic: {
    type: Boolean,
    default: false
  },
  shareToken: String
}, {
  timestamps: true
});

// Indexes
wishlistSchema.index({ user: 1 });
wishlistSchema.index({ shareToken: 1 }, { sparse: true });

export const WishlistModel = mongoose.model('Wishlist', wishlistSchema);