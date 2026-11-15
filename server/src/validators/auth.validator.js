import { ApiError } from '../utils/ApiError.js';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const validRoles = ['elderly', 'caregiver', 'family', 'admin'];

/**
 * Validates registration input data.
 */
export const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Full name is required and must be at least 2 characters.');
  }

  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push('Password is required and must be at least 8 characters long.');
  }

  if (role && !validRoles.includes(role)) {
    errors.push(`Invalid role specified. Permitted roles: ${validRoles.join(', ')}.`);
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Registration validation failed.', errors));
  }

  next();
};

/**
 * Validates login input data.
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Login validation failed.', errors));
  }

  next();
};

/**
 * Validates forgot password email input.
 */
export const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    return next(ApiError.badRequest('A valid email address is required to reset password.'));
  }

  next();
};

/**
 * Validates reset password payload.
 */
export const validateResetPassword = (req, res, next) => {
  const { password } = req.body;

  if (!password || typeof password !== 'string' || password.length < 8) {
    return next(
      ApiError.badRequest('New password is required and must be at least 8 characters long.')
    );
  }

  next();
};

export default {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
};
