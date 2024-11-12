import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['EMAIL', 'SMS', 'SYSTEM'],
    required: true
  },
  title: String,
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'FAILED'],
    default: 'PENDING'
  },
  readAt: Date,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, status: 1 });
notificationSchema.index({ recipient: 1, readAt: 1 });

export const NotificationModel = mongoose.model('Notification', notificationSchema);