import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  scope: {
    type: String,
    enum: ['GLOBAL', 'ORGANIZATION', 'TEAM'],
    default: 'GLOBAL'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

permissionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Permission = mongoose.model('Permission', permissionSchema);