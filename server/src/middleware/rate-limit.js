import rateLimit from 'express-rate-limit';
import { isTest } from '../config/env.js';

// Common JSON error shape for rate-limit responses.
function rateLimitHandler(req, res) {
  res.status(429).json({
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.'
    }
  });
}

/**
 * Strict limiter for authentication endpoints.
 * 5 attempts / 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  // Disable during tests so they aren't tripped by repeated calls.
  skip: () => isTest
});

/**
 * Permissive global limiter for all other endpoints.
 * ~100 requests / minute per IP.
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: () => isTest
});
