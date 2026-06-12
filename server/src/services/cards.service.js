import { Card } from '../models/Card.js';
import { MAX_CARDS_PER_DECK } from '@flashcards/shared';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { getDeckForUser } from './decks.service.js';

/**
 * Add a card to a deck the user owns.
 * Authorizes via the parent deck, enforces the per-deck
 * card limit, and assigns a stable creation order
 */
export async function addCardToDeck(deckId, userId, { front, back }) {
  // Throws NotFoundError if the deck doesn't exist or isn't owned by user.
  await getDeckForUser(deckId, userId);

  const count = await Card.countDocuments({ deckId });
  if (count >= MAX_CARDS_PER_DECK) {
    throw new ConflictError(
      `Card limit reached for this deck (max ${MAX_CARDS_PER_DECK}).`
    );
  }

  // Next order = current highest order + 1 (stable append order).
  const last = await Card.findOne({ deckId })
    .sort({ order: -1 })
    .select('order');
  const nextOrder = last ? last.order + 1 : 0;

  return Card.create({ deckId, front, back, order: nextOrder });
}

/**
 * Internal helper: load a card and authorize the user via its parent deck.
 * Throws NotFoundError if the card is missing or the deck isn't owned.
 */
async function getCardForUser(cardId, userId) {
  const card = await Card.findById(cardId);
  if (!card) {
    throw new NotFoundError('Card not found.');
  }
  // Reuse the deck ownership chokepoint; throws NotFoundError if not owned.
  await getDeckForUser(card.deckId, userId);
  return card;
}

/**
 * Update a card's front and/or back. Ownership enforced via parent deck.
 */
export async function updateCard(cardId, userId, updates) {
  const card = await getCardForUser(cardId, userId);
  if (updates.front !== undefined) card.front = updates.front;
  if (updates.back !== undefined) card.back = updates.back;
  await card.save();
  return card;
}

/**
 * Delete a card. Ownership enforced via parent deck.
 */
export async function deleteCard(cardId, userId) {
  const card = await getCardForUser(cardId, userId);
  await Card.deleteOne({ _id: card._id });
}
