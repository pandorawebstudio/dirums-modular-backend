import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  parentRole: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  },
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

roleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

roleSchema.methods.hasPermission = async function(permissionName) {
  await this.populate('permissions');
  return this.permissions.some(p => p.name === permissionName);
};

roleSchema.methods.inheritsFrom = async function(roleId) {
  if (!this.parentRole) return false;
  
  if (this.parentRole.equals(roleId)) return true;
  
  await this.populate('parentRole');
  return this.parentRole.inheritsFrom(roleId);
};

export const Role = mongoose.model('Role', roleSchema);