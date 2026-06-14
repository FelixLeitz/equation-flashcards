import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import * as Sentry from '@sentry/node';

import { env, isTest } from './config/env.js';
import { logger } from './config/logger.js';
import { applySecurity } from './middleware/security.js';
import passport from './config/passport.js';
import { globalLimiter } from './middleware/rate-limit.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import deckRoutes from './routes/decks.routes.js';
import cardRoutes from './routes/cards.routes.js';
import accountRoutes from './routes/account.routes.js';

export function createApp() {
  const app = express();

  // Trust the hosting provider's proxy (needed for Secure cookies, real IPs).
  app.set('trust proxy', 1);

  // Security headers + CORS.
  applySecurity(app);

  // Body and cookie parsing.
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // Passport (stateless — no sessions).
  app.use(passport.initialize());

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
  app.use('/api/decks', deckRoutes);
  app.use('/api/cards', cardRoutes);
  app.use('/api/account', accountRoutes);

  // 404 + error handling (must be last).
  app.use(notFoundHandler);

  // Sentry captures errors before our handler formats the response.
  // Only active when a DSN is configured (initSentry ran in server.js).
  if (env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
  }

  app.use(errorHandler);

  return app;
}
