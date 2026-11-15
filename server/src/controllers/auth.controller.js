import { env } from '../config/env.js';
import * as authService from '../services/auth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Helper to set secure HTTP-only authentication cookie.
 */
const setAuthCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };

  res.cookie('carecircle_token', token, cookieOptions);
};

/**
 * @route POST /api/v1/auth/register
 * @desc  Register new account (elderly, family, caregiver)
 */
export const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body);
  setAuthCookie(res, token);
  return ApiResponse.created(res, { user, token }, 'User registered successfully.');
});

/**
 * @route POST /api/v1/auth/login
 * @desc  Authenticate credentials and return JWT & cookie
 */
export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  setAuthCookie(res, token);
  return ApiResponse.ok(res, { user, token }, 'Login successful.');
});

/**
 * @route POST /api/v1/auth/logout
 * @desc  Clear authentication session & cookie
 */
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('carecircle_token', {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    path: '/',
  });

  return ApiResponse.ok(res, null, 'Logged out successfully.');
});

/**
 * @route GET /api/v1/auth/me
 * @desc  Get currently authenticated user
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  return ApiResponse.ok(res, req.user, 'Current user profile retrieved successfully.');
});

/**
 * @route POST /api/v1/auth/forgot-password
 * @desc  Generate password reset token
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  return ApiResponse.ok(res, result, result.message);
});

/**
 * @route POST /api/v1/auth/reset-password/:token
 * @desc  Reset password with token
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token: resetToken } = req.params;
  const { password } = req.body;

  const { user, token } = await authService.resetPassword(resetToken, password);
  setAuthCookie(res, token);

  return ApiResponse.ok(res, { user, token }, 'Password has been reset successfully.');
});

export default {
  register,
  login,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
};
