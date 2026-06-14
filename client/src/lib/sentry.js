import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for the browser if a DSN is configured.
 * No-op in development unless VITE_SENTRY_DSN is set.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    // Don't capture PII (form values, etc.) by default.
    sendDefaultPii: false
  });
}

export { Sentry };
