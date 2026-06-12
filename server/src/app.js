import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { isTest } from './config/env.js';
import { logger } from './config/logger.js';
import { applySecurity } from './middleware/security.js';
import { globalLimiter } from './middleware/rate-limit.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';

export function createApp() {
  const app = express();

  // Trust the hosting provider's proxy (needed for Secure cookies, real IPs).
  app.set('trust proxy', 1);

  // Security headers + CORS.
  applySecurity(app);

  // Body and cookie parsing.
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // HTTP request logging (skip noise during tests).
  if (!isTest) {
    app.use(
      morgan('dev', {
        stream: { write: (msg) => logger.info(msg.trim()) }
      })
    );
  }

  // Permissive global rate limit on the API (skip during tests).
  // More strict limits are applied on specific endpoints like auth.
  app.use('/api', globalLimiter);

  // Routes.
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);

  // 404 + error handling (must be last).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
