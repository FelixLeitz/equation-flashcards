import { asyncHandler } from '../utils/async-handler.js';
import { deleteAccount } from '../services/account.service.js';
import { clearAuthCookie } from '../utils/auth-tokens.js';

/**
 * DELETE /api/account
 * Deletes the authenticated user's account and all owned data,
 * then clears the auth cookie.
 */
export const remove = asyncHandler(async (req, res) => {
  await deleteAccount(req.user.id);
  clearAuthCookie(res);
  res.status(204).send();
});
