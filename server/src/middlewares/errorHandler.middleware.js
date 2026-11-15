import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Centralized Global Error Handler.
 * Formats all errors into a standardized JSON response.
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Transform non-ApiError errors into standardized ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Something went wrong on the server';
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  // Handle specific MongoDB / Mongoose errors
  if (err.name === 'CastError') {
    error = new ApiError(400, `Resource not found. Invalid ${err.path}: ${err.value}`);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = new ApiError(409, `Duplicate value for ${field}. Please use another value.`);
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((val) => val.message);
    error = new ApiError(400, 'Validation Error', messages);
  }

  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid authentication token. Please log in again.');
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Authentication token has expired. Please log in again.');
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors?.length ? error.errors : undefined,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    ...(env.isDevelopment && { stack: error.stack }),
  };

  if (env.isDevelopment) {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, error);
  }

  res.status(error.statusCode).json(response);
};

export default errorHandler;
