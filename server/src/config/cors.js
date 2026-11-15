import { env } from './env.js';

/**
 * Dynamic CORS options configuration.
 * Supports development origins and production custom origins.
 */
export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman, health-checks)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      env.CLIENT_URL,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
    ];

    if (allowedOrigins.includes(origin) || env.isDevelopment) {
      return callback(null, true);
    }

    return callback(new Error(`CORS error: Origin ${origin} not allowed by Access-Control-Allow-Origin`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours
};

export default corsOptions;
