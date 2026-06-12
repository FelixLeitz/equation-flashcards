import passport from '../config/passport.js';
import { asyncHandler } from '../utils/async-handler.js';
import { createUser } from '../services/auth.service.js';
import { issueAuthCookie, clearAuthCookie } from '../utils/auth-tokens.js';
import { AuthError } from '../utils/errors.js';

// Shared shape for returning a user in responses.
function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName
  };
}

/**
 * POST /api/auth/signup
 * Creates an account, logs the user in (sets auth cookie), returns the user.
 * Body is pre-validated by validateBody(signupSchema).
 */
export const signup = asyncHandler(async (req, res) => {
  const { email, displayName, password } = req.body;
  const user = await createUser({ email, displayName, password });

  // Auto-login the new user.
  issueAuthCookie(res, user);

  res.status(201).json({ user: publicUser(user) });
});

/**
 * POST /api/auth/login
 * Verifies credentials via the local strategy. On success, sets the auth
 * cookie and returns the user. On failure, returns a generic 401
 */
export const login = (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(new AuthError('Invalid email or password.'));
    }
    issueAuthCookie(res, user);
    res.status(200).json({ user: publicUser(user) });
  })(req, res, next);
};

/**
 * POST /api/auth/logout
 * Clears the auth cookie.
 */
export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.status(204).send();
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user. Protected by requireAuth.
 */
export const me = asyncHandler(async (req, res) => {
  res.status(200).json({ user: publicUser(req.user) });
});
