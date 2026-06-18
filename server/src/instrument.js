// Sentry instrumentation — preloaded via:
//   node --import ./src/instrument.js src/server.js
//
// Loading Sentry here (before server.js and its imports) lets the SDK
// auto-instrument http/express. No-ops when SENTRY_DSN is unset.
import { initSentry } from './config/sentry.js';

initSentry();
