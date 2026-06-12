import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  connectDatabase,
  disconnectDatabase
} from '../../src/config/database.js';

let mongoServer;

/**
 * Start an in-memory MongoDB and connect Mongoose to it.
 * Call in a Mocha `before` hook.
 */
export async function setupTestDatabase() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDatabase(uri);
}

/**
 * Disconnect and stop the in-memory MongoDB.
 * Call in a Mocha `after` hook.
 */
export async function teardownTestDatabase() {
  await disconnectDatabase();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

/**
 * Remove all documents from all collections.
 * Call in a `beforeEach` hook to isolate tests from each other.
 */
export async function clearTestDatabase() {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
}
