import { Deck } from '../models/Deck.js';
import { Card } from '../models/Card.js';
import { MAX_DECKS_PER_USER } from '@flashcards/shared';
import { NotFoundError, ConflictError } from '../utils/errors.js';

/**
 * Create a deck owned by the given user.
 * Enforces the per-user deck limit.
 */
export async function createDeck(userId, { title, description }) {
  const count = await Deck.countDocuments({ ownerId: userId });
  if (count >= MAX_DECKS_PER_USER) {
    throw new ConflictError(`Deck limit reached (max ${MAX_DECKS_PER_USER}).`);
  }
  return Deck.create({ ownerId: userId, title, description });
}

/**
 * List all decks owned by the user, most-recently-updated first. Includes a cardCount for each deck.
 */
export async function listDecksForUser(userId) {
  const decks = await Deck.find({ ownerId: userId })
    .sort({ updatedAt: -1 })
    .lean();

  if (decks.length === 0) {
    return [];
  }

  // Attach card counts in a single aggregation.
  const deckIds = decks.map((d) => d._id);
  const counts = await Card.aggregate([
    { $match: { deckId: { $in: deckIds } } },
    { $group: { _id: '$deckId', count: { $sum: 1 } } }
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

  return decks.map((d) => ({
    id: d._id.toString(),
    title: d.title,
    description: d.description,
    cardCount: countMap.get(d._id.toString()) || 0,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt
  }));
}

/**
 * Fetch a single deck owned by the user.
 * Throws NotFoundError if it doesn't exist OR isn't owned by the user.
 */
export async function getDeckForUser(deckId, userId) {
  const deck = await Deck.findOne({ _id: deckId, ownerId: userId });
  if (!deck) {
    throw new NotFoundError('Deck not found.');
  }
  return deck;
}

/**
 * Fetch a deck together with its cards, ordered by creation order
 * (used by the study/detail view). Ownership enforced.
 */
export async function getDeckWithCards(deckId, userId) {
  const deck = await getDeckForUser(deckId, userId);
  const cards = await Card.find({ deckId: deck._id }).sort({ order: 1 });
  return { deck, cards };
}

/**
 * Update a deck's title and/or description. Ownership enforced.
 */
export async function updateDeck(deckId, userId, updates) {
  const deck = await getDeckForUser(deckId, userId);
  if (updates.title !== undefined) deck.title = updates.title;
  if (updates.description !== undefined) deck.description = updates.description;
  await deck.save();
  return deck;
}

/**
 * Delete a deck and cascade-delete its cards.
 * Ownership enforced. Uses a transaction when the connection supports it,
 * otherwise falls back to sequential deletes.
 */
export async function deleteDeck(deckId, userId) {
  const deck = await getDeckForUser(deckId, userId);

  const session = await Deck.startSession();
  try {
    await session.withTransaction(async () => {
      await Card.deleteMany({ deckId: deck._id }, { session });
      await Deck.deleteOne({ _id: deck._id }, { session });
    });
  } catch (err) {
    // mongodb-memory-server (standalone) doesn't support transactions;
    // fall back to non-transactional deletes in that environment.
    if (
      err.code === 20 ||
      /Transaction numbers|replica set|transactions are not supported/i.test(
        err.message
      )
    ) {
      await Card.deleteMany({ deckId: deck._id });
      await Deck.deleteOne({ _id: deck._id });
    } else {
      throw err;
    }
  } finally {
    await session.endSession();
  }
}
