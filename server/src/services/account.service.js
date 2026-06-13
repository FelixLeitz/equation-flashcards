import { User } from '../models/User.js';
import { Deck } from '../models/Deck.js';
import { Card } from '../models/Card.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Delete a user account and cascade-delete all of their decks and cards.
 * Atomic where the connection supports transactions,
 * with a standalone fallback for environments that don't
 * (e.g., mongodb-memory-server in tests).
 *
 * @param {string} userId
 * @throws {NotFoundError} if the user does not exist
 */
export async function deleteAccount(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('Account not found.');
  }

  // Gather the user's deck ids so we can remove their cards in one query.
  const decks = await Deck.find({ ownerId: userId }).select('_id').lean();
  const deckIds = decks.map((d) => d._id);

  const session = await User.startSession();
  try {
    await session.withTransaction(async () => {
      if (deckIds.length > 0) {
        await Card.deleteMany({ deckId: { $in: deckIds } }, { session });
        await Deck.deleteMany({ ownerId: userId }, { session });
      }
      await User.deleteOne({ _id: userId }, { session });
    });
  } catch (err) {
    // Standalone MongoDB (no transactions) — fall back to sequential deletes.
    if (
      err.code === 20 ||
      /Transaction numbers|replica set|transactions are not supported/i.test(
        err.message
      )
    ) {
      if (deckIds.length > 0) {
        await Card.deleteMany({ deckId: { $in: deckIds } });
        await Deck.deleteMany({ ownerId: userId });
      }
      await User.deleteOne({ _id: userId });
    } else {
      throw err;
    }
  } finally {
    await session.endSession();
  }
}
