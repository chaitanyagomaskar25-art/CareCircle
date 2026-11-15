import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Authentication Middleware.
 * Verifies JWT access token passed via Authorization Bearer header or HTTP-only cookie.
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  let token = null;

  // 1. Check Authorization header: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  // 2. Fallback to HTTP-only cookie if header is absent
  else if (req.cookies && req.cookies.carecircle_token) {
    token = req.cookies.carecircle_token;
  }

  if (!token) {
    throw ApiError.unauthorized('Authentication required. No access token provided.');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Fetch user from DB to ensure account is active and not deleted
    const user = await User.findById(decoded.id);

    if (!user) {
      throw ApiError.unauthorized('User session invalid. Account no longer exists.');
    }

    if (user.accountStatus !== 'active') {
      throw ApiError.forbidden(`Your account has been ${user.accountStatus}. Please contact support.`);
    }

    // Attach authenticated user to request
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Session expired. Please sign in again.');
    }
    throw ApiError.unauthorized('Invalid authentication token.');
  }
});

/**
 * Role-Based Authorization Middleware.
 * Restricts route access to specified user roles.
 *
 * @param {...string} roles - Permitted roles (e.g. 'admin', 'caregiver', 'family')
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required prior to permission check.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Role '${req.user.role}' does not have permission to perform this action.`
        )
      );
    }

    next();
  };
};

export default {
  authenticate,
  authorizeRoles,
};
