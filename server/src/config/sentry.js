import * as Sentry from '@sentry/node';
import { env, isProduction } from './env.js';

/**
 * Initialize Sentry if a DSN is configured. No-op otherwise (e.g. local dev,
 * tests). Must be called before the Express app is created so the SDK can
 * auto-instrument http/express.
 */
export function initSentry() {
  if (!env.SENTRY_DSN) {
    return false;
  }
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    // Modest trace sampling; tune later. 0 disables performance tracing.
    tracesSampleRate: isProduction ? 0.1 : 0,
    // Don't send PII by default.
    sendDefaultPii: false
  });
  return true;
}

export { Sentry };
