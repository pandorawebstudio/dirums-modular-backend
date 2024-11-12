import mongoose from 'mongoose';

const dashboardWidgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['SALES', 'ORDERS', 'CUSTOMERS', 'INVENTORY', 'CUSTOM'],
    required: true
  },
  config: {
    position: {
      x: Number,
      y: Number
    },
    size: {
      width: Number,
      height: Number
    },
    refreshInterval: Number,
    filters: Map
  }
});

const vendorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  businessDetails: {
    registrationNumber: String,
    taxId: String,
    bankAccount: {
      name: String,
      number: String,
      routingNumber: String
    }
  },
  commission: {
    type: Number,
    required: true,
    default: 10
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'SUSPENDED'],
    default: 'PENDING'
  },
  rating: {
    average: Number,
    count: Number
  },
  performance: {
    fulfillmentRate: Number,
    responseTime: Number,
    cancelationRate: Number
  }
});

export const DashboardWidget = mongoose.model('DashboardWidget', dashboardWidgetSchema);
export const Vendor = mongoose.model('Vendor', vendorSchema);