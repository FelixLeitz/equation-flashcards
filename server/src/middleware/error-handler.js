import { logger } from '../config/logger.js';
import { isProduction } from '../config/env.js';
import { AppError } from '../utils/errors.js';

// 404 handler for unmatched routes — must be registered after all routes.
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`
    }
  });
}

// Centralized error handler — must be registered LAST (4 args)
export function errorHandler(err, req, res, next) {
  const isOperational = err instanceof AppError;
  const statusCode = isOperational ? err.statusCode : 500;

  // Log full detail server-side; never expose internals to the client.
  if (statusCode >= 500) {
    logger.error({ err, path: req.originalUrl }, 'Unhandled error');
  } else {
    logger.warn({ code: err.code, path: req.originalUrl }, err.message);
  }

  const body = {
    error: {
      code: isOperational ? err.code : 'INTERNAL_SERVER_ERROR',
      message: isOperational ? err.message : 'An unexpected error occurred.'
    }
  };

  // Include validation details when present.
  if (err.details) {
    body.error.details = err.details;
  }

  // Include stack only in non-production for debugging convenience.
  if (!isProduction && !isOperational) {
    body.error.stack = err.stack;
  }

  res.status(statusCode).json(body);
}
