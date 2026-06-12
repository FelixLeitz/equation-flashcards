import { User } from '../models/User.js';
import { ConflictError } from '../utils/errors.js';

/**
 * Create a new user account.
 * Throws ConflictError (409) if the email is already registered.
 * @param {{ email: string, displayName: string, password: string }} input
 * @returns {Promise<User>} the created user document (hash excluded from output)
 */
export async function createUser({ email, displayName, password }) {
  try {
    const user = await User.create({ email, displayName, password });
    return user;
  } catch (err) {
    // MongoDB duplicate-key error (unique email index).
    if (err.code === 11000) {
      throw new ConflictError('An account with that email already exists.');
    }
    throw err;
  }
}
