import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

/**
 * In-memory sliding window rate limiter middleware for sensitive endpoints.
 *
 * @param {number} maxRequests - Max requests allowed per window
 * @param {number} windowMs - Time window in milliseconds
 */
export const rateLimiter = (maxRequests = 15, windowMs = 15 * 60 * 1000) => {
  const ipMap = new Map();

  // Allow higher capacity in development/test environments
  const effectiveMax = env.isDevelopment ? 200 : maxRequests;

  // Periodic cleanup of stale IP entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipMap.entries()) {
      if (now - data.startTime > windowMs) {
        ipMap.delete(ip);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    // Determine client identifier (IP address)
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    const now = Date.now();
    let entry = ipMap.get(clientIp);

    if (!entry || now - entry.startTime > windowMs) {
      entry = { count: 1, startTime: now };
      ipMap.set(clientIp, entry);
      return next();
    }

    entry.count += 1;

    if (entry.count > effectiveMax) {
      const retryAfterSeconds = Math.ceil((entry.startTime + windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);

      return next(
        new ApiError(
          429,
          `Too many authentication attempts. Please wait ${Math.ceil(
            retryAfterSeconds / 60
          )} minute(s) before trying again.`
        )
      );
    }

    next();
  };
};

export default rateLimiter;
