import { initSentry } from './config/sentry.js';
initSentry();

import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

async function start() {
  // Connect to the database before accepting traffic.
  try {
    await connectDatabase();
  } catch (err) {
    logger.error({ err }, 'Failed to connect to MongoDB — exiting.');
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server listening on http://localhost:${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown: stop accepting requests, then close the DB.
  async function shutdown(signal) {
    logger.info(`${signal} received — shutting down gracefully.`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
