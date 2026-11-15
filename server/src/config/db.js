import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

/**
 * Connect to MongoDB with connection pooling and error resilience.
 */
export const connectDB = async () => {
  if (isConnected) {
    console.log('[Database] Using existing MongoDB connection.');
    return;
  }

  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
  };

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, options);
    isConnected = !!conn.connections[0].readyState;
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[Database Error] MongoDB connection failure: ${error.message}`);
    // In development, do not immediately kill the process if local Mongo is not running yet
    // This allows the server to serve health check with DB status 'disconnected'
    if (env.isProduction) {
      process.exit(1);
    }
  }

  // Connection event listeners
  mongoose.connection.on('connected', () => {
    isConnected = true;
    console.log('[Database] MongoDB connection established.');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[Database Error] MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[Database] MongoDB disconnected.');
  });
};

/**
 * Returns current MongoDB connection status.
 */
export const getDatabaseStatus = () => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized',
  };

  const stateCode = mongoose.connection.readyState;
  return {
    state: stateMap[stateCode] || 'unknown',
    statusCode: stateCode,
    isConnected: stateCode === 1,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
};

/**
 * Close MongoDB connection gracefully.
 */
export const closeDB = async () => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    console.log('[Database] MongoDB connection closed.');
  }
};

export default connectDB;
