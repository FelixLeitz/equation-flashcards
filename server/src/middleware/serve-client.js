import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// server/src/middleware -> repo root -> client/dist
const CLIENT_DIST = path.resolve(__dirname, '../../../client/dist');

/**
 * Serve the built React app in production.
 * - Serves hashed static assets with long cache headers.
 * - SPA fallback: any non-/api GET returns index.html so client-side
 *   routing (React Router) works on hard refresh / deep links.
 * Call AFTER all /api routes and the 404 handler for API, but BEFORE the
 * final error handler.
 */
export function serveClient(app) {
  // Static assets (JS/CSS are content-hashed by Vite -> safe to cache hard).
  app.use(
    express.static(CLIENT_DIST, {
      index: false, // we handle '/' via the SPA fallback below
      maxAge: '1y',
      setHeaders: (res, filePath) => {
        // Never hard-cache index.html (it references hashed assets).
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    })
  );

  // SPA fallback for all non-API GET requests.
  // The regex excludes anything starting with /api so unknown API paths
  // still fall through to the JSON 404 handler.
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

export { CLIENT_DIST };
