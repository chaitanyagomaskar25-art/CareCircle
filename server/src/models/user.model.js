import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Never return password hash in default queries
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: {
        values: ['elderly', 'caregiver', 'family', 'admin'],
        message: '{VALUE} is not a valid CareCircle role',
      },
      default: 'family',
      index: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    accountStatus: {
      type: String,
      enum: {
        values: ['active', 'pending', 'suspended'],
        message: '{VALUE} is not a valid account status',
      },
      default: 'active',
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    timezone: {
      type: String,
      default: 'UTC',
      trim: true,
    },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Pre-save middleware: hash password if modified.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Compare candidate password with stored bcrypt hash.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Sign and generate JWT access token.
 */
userSchema.methods.generateAuthToken = function () {
  const payload = {
    id: this._id.toString(),
    role: this.role,
    email: this.email,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Generate secure password reset token and store hash in document.
 */
userSchema.methods.generateResetPasswordToken = function () {
  // Generate random 32-byte hex token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token before storing in database (SHA-256)
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Token valid for 15 minutes
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

export const User = mongoose.model('User', userSchema);
export default User;
