import crypto from 'node:crypto';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Register a new user in CareCircle.
 */
export const register = async ({ name, email, password, phone, role, profileImage }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if account already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw ApiError.conflict('An account with this email address already exists.');
  }

  // Prevent arbitrary client self-elevation to admin
  const assignedRole = role === 'admin' ? 'family' : role || 'family';

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    phone: phone ? phone.trim() : '',
    role: assignedRole,
    profileImage: profileImage || '',
    accountStatus: 'active',
  });

  const token = user.generateAuthToken();

  return {
    user,
    token,
  };
};

/**
 * Authenticate existing user with email and password.
 */
export const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Explicitly select password hash
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  if (user.accountStatus !== 'active') {
    throw ApiError.forbidden(`Your account has been ${user.accountStatus}. Please contact support.`);
  }

  // Update last login timestamp
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = user.generateAuthToken();

  return {
    user,
    token,
  };
};

/**
 * Get currently authenticated user profile.
 */
export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User profile not found.');
  }
  return user;
};

/**
 * Initiate password reset request.
 */
export const forgotPassword = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    // For security, do not disclose whether user email exists
    return {
      message: 'If that email address is registered, a password reset link has been dispatched.',
      resetToken: null,
    };
  }

  const resetToken = user.generateResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  return {
    message: 'If that email address is registered, a password reset link has been dispatched.',
    resetToken, // Returned in development / test environment for direct API verification
  };
};

/**
 * Complete password reset using token and new password.
 */
export const resetPassword = async (rawToken, newPassword) => {
  // Hash token to compare with database entry
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw ApiError.badRequest('Password reset token is invalid or has expired.');
  }

  // Set new password (pre-save hook will hash it)
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const token = user.generateAuthToken();

  return {
    user,
    token,
  };
};

export default {
  register,
  login,
  getCurrentUser,
  forgotPassword,
  resetPassword,
};
