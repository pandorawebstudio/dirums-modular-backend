import mongoose from 'mongoose';

const workflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  trigger: {
    event: {
      type: String,
      enum: ['ORDER_CREATED', 'ORDER_STATUS_CHANGED', 'INVENTORY_LOW', 'PAYMENT_RECEIVED'],
      required: true
    },
    conditions: [{
      field: String,
      operator: String,
      value: mongoose.Schema.Types.Mixed
    }]
  },
  actions: [{
    type: {
      type: String,
      enum: ['EMAIL', 'SMS', 'WEBHOOK', 'UPDATE_STATUS', 'NOTIFY_ADMIN'],
      required: true
    },
    config: {
      template: String,
      recipient: String,
      url: String,
      method: String,
      headers: Map,
      payload: mongoose.Schema.Types.Mixed
    }
  }],
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  }
});

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
  content: String,
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'FAILED'],
    default: 'PENDING'
  },
  metadata: Map,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Workflow = mongoose.model('Workflow', workflowSchema);
export const Notification = mongoose.model('Notification', notificationSchema);