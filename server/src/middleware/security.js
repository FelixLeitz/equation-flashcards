import helmet from 'helmet';
import cors from 'cors';
import { env } from '../config/env.js';

export function applySecurity(app) {
  // Sets sensible security headers (HSTS, X-Content-Type-Options, etc.)
  app.use(helmet());

  // Restrict cross-origin requests to the configured frontend origin.
  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN,
      credentials: true // allow cookies (needed for JWT cookie auth)
    })
  );
}
