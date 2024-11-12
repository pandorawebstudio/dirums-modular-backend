import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    sparse: true,
    unique: true
  },
  email: {
    type: String,
    sparse: true,
    unique: true
  },
  password: String,
  role: {
    type: String,
    enum: ['CUSTOMER', 'VENDOR', 'ADMIN', 'STAFF'],
    required: true
  },
  name: String,
  businessName: String,
  businessAddress: String,
  businessType: String,
  taxId: String
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

export const UserModel = mongoose.model('User', userSchema);