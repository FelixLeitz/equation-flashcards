import passport from '../config/passport.js';
import { AuthError } from '../utils/errors.js';

/**
 * Protect a route: require a valid JWT cookie.
 * On success, attaches the user to req.user.
 * On failure, forwards a 401 AuthError (REQ-AUTH-001).
 */
export function requireAuth(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(new AuthError());
    }
    req.user = user;
    next();
  })(req, res, next);
}
