import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

// Fail fast on undefined fields slipping into queries.
mongoose.set('strictQuery', true);

/**
 * Connect to MongoDB. Accepts an optional URI override (used by tests
 * to pass the in-memory server URI).
 */
export async function connectDatabase(uri = env.MONGODB_URI) {
  if (!uri) {
    throw new Error('No MongoDB connection URI provided.');
  }

  // Wire up connection event logging once.
  const connection = mongoose.connection;
  connection.on('connected', () => logger.info('MongoDB connected.'));
  connection.on('error', (err) =>
    logger.error({ err }, 'MongoDB connection error.')
  );
  connection.on('disconnected', () => logger.warn('MongoDB disconnected.'));

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000
  });

  return connection;
}

/**
 * Gracefully close the MongoDB connection.
 */
export async function disconnectDatabase() {
  await mongoose.disconnect();
  logger.info('MongoDB connection closed.');
}
