import { env } from '../config/env.js';
import { getDatabaseStatus } from '../config/db.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Health check controller.
 * Provides system status, uptime, database connectivity, and runtime metrics.
 */
export const getHealthStatus = asyncHandler(async (req, res) => {
  const dbStatus = getDatabaseStatus();

  const healthData = {
    service: 'CareCircle API',
    status: 'healthy',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(1)}s`,
    database: {
      status: dbStatus.state,
      connected: dbStatus.isConnected,
      name: dbStatus.name,
    },
    memory: {
      heapUsedMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
      rssMB: (process.memoryUsage().rss / 1024 / 1024).toFixed(2),
    },
    version: '1.0.0',
  };

  return ApiResponse.ok(res, healthData, 'System is healthy and operational');
});

export default {
  getHealthStatus,
};
