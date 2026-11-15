import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from server root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnvVars = ['NODE_ENV', 'MONGODB_URI', 'JWT_SECRET'];

/**
 * Validates required environment variables and returns a frozen configuration object.
 */
const validateEnv = () => {
  const missing = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[Config Error] Missing required environment variables:\n  - ${missing.join('\n  - ')}\n` +
      `Please check your server/.env file or copy from server/.env.example.`
    );
  }

  const port = parseInt(process.env.PORT, 10) || 5000;
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(`[Config Error] PORT must be a valid port number between 1 and 65535. Received: ${process.env.PORT}`);
  }

  return Object.freeze({
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: port,
    API_PREFIX: process.env.API_PREFIX || '/api/v1',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    SMTP: {
      HOST: process.env.SMTP_HOST || '',
      PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
      USER: process.env.SMTP_USER || '',
      PASS: process.env.SMTP_PASS || '',
      FROM: process.env.EMAIL_FROM || 'CareCircle <noreply@carecircle.com>',
    },
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
  });
};

export const env = validateEnv();
export default env;
