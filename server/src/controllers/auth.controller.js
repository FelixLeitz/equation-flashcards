import { asyncHandler } from '../utils/async-handler.js';
import { createUser } from '../services/auth.service.js';

/**
 * POST /api/auth/signup
 * Creates a new account. Body is pre-validated by validateBody(signupSchema).
 */
export const signup = asyncHandler(async (req, res) => {
  const { email, displayName, password } = req.body;
  const user = await createUser({ email, displayName, password });

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName
    }
  });
});
