import http from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB, closeDB } from './config/db.js';
import { initSocket } from './sockets/socket.js';
import { initReminderCron, stopReminderCron } from './jobs/reminderCron.js';

// Create native HTTP Server wrapping Express
const server = http.createServer(app);

// Initialize real-time Socket.IO
initSocket(server);

// Start server after initializing database
const startServer = async () => {
  await connectDB();

  // Initialize automated reminder cron engine
  initReminderCron();

  server.listen(env.PORT, () => {
    console.log(`=======================================================`);
    console.log(` CareCircle API Server running on port ${env.PORT}`);
    console.log(` Environment: ${env.NODE_ENV}`);
    console.log(` Health Check: http://localhost:${env.PORT}${env.API_PREFIX}/health`);
    console.log(` Client Origin: ${env.CLIENT_URL}`);
    console.log(`=======================================================`);
  });
};

// Graceful Shutdown handling
const handleGracefulShutdown = async (signal) => {
  console.log(`\n[Process] Received ${signal}. Starting graceful shutdown...`);
  stopReminderCron();
  server.close(async () => {
    console.log('[Server] HTTP server closed.');
    await closeDB();
    console.log('[Process] Cleanup complete. Exiting process.');
    process.exit(0);
  });

  // Force exit if shutdown hangs
  setTimeout(() => {
    console.error('[Process] Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process Error] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Process Error] Uncaught Exception:', error);
  process.exit(1);
});

startServer();
