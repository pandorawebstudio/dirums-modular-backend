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
  avatar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media'
  },
  businessProfile: {
    name: String,
    logo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media'
    },
    banner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media'
    },
    description: String,
    address: String,
    documents: [{
      type: {
        type: String,
        enum: ['REGISTRATION', 'TAX', 'IDENTITY', 'OTHER']
      },
      media: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Media'
      },
      verificationStatus: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'REJECTED'],
        default: 'PENDING'
      }
    }]
  }
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