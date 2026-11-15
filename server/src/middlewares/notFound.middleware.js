import { ApiError } from '../utils/ApiError.js';

/**
 * 404 Route Not Found Middleware.
 * Catches unhandled routes and forwards an ApiError to the global error handler.
 */
export const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Cannot ${req.method} ${req.originalUrl} - Route not found`));
};

export default notFoundHandler;
