import jwt from 'jsonwebtoken';
import { env, isProduction } from '../config/env.js';

const COOKIE_NAME = 'token';

// Convert the JWT_EXPIRES_IN (e.g. '7d') to milliseconds for the cookie maxAge.
// Supports the common 'd' (days) / 'h' (hours) / 'm' (minutes) suffixes.
function expiresInMs(value) {
  const match = /^(\d+)([dhm])$/.exec(value);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // fallback: 7 days
  const n = Number(match[1]);
  const unit = match[2];
  const unitMs = { d: 86400000, h: 3600000, m: 60000 }[unit];
  return n * unitMs;
}

/**
 * Sign a JWT for the given user. `sub` carries the user id.
 */
export function signToken(user) {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN
  });
}

/**
 * Set the auth cookie on the response
 */
export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction, // Secure only over HTTPS (prod); allows http in dev
    sameSite: 'lax',
    maxAge: expiresInMs(env.JWT_EXPIRES_IN),
    path: '/'
  });
}

/**
 * Convenience: sign a token for the user and set it as the auth cookie.
 */
export function issueAuthCookie(res, user) {
  const token = signToken(user);
  setAuthCookie(res, token);
}

/**
 * Clear the auth cookie (logout).
 */
export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/'
  });
}
