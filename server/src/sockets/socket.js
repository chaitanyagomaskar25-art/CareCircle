import { Server } from 'socket.io';
import { env } from '../config/env.js';

let ioInstance = null;

/**
 * Initialize Socket.IO instance attached to HTTP Server.
 * @param {import('http').Server} httpServer
 */
export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: [
        env.CLIENT_URL,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
  });

  ioInstance.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join personal notification channel
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined user:${userId}`);
      }
    });

    // Join care circle room
    socket.on('join_circle', (circleId) => {
      if (circleId) {
        socket.join(`circle:${circleId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined circle:${circleId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected (${socket.id}): ${reason}`);
    });
  });

  return ioInstance;
};

/**
 * Getter for current Socket.IO instance across controllers/services.
 */
export const getIO = () => {
  return ioInstance;
};

/**
 * Real-time event dispatcher to an individual user's active sockets.
 */
export const emitToUser = (userId, event, data) => {
  if (!ioInstance) return false;
  try {
    ioInstance.to(`user:${userId.toString()}`).emit(event, data);
    return true;
  } catch (err) {
    console.error(`[Socket.IO] Failed to emit ${event} to user ${userId}:`, err.message);
    return false;
  }
};

/**
 * Real-time event dispatcher to a care circle group room.
 */
export const emitToCircle = (circleId, event, data) => {
  if (!ioInstance) return false;
  try {
    ioInstance.to(`circle:${circleId.toString()}`).emit(event, data);
    return true;
  } catch (err) {
    console.error(`[Socket.IO] Failed to emit ${event} to circle ${circleId}:`, err.message);
    return false;
  }
};

export default {
  initSocket,
  getIO,
  emitToUser,
  emitToCircle,
};
