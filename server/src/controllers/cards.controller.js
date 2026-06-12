import { asyncHandler } from '../utils/async-handler.js';
import {
  addCardToDeck,
  updateCard,
  deleteCard
} from '../services/cards.service.js';

/**
 * POST /api/decks/:deckId/cards
 * Body pre-validated by validateBody(createCardSchema).
 */
export const create = asyncHandler(async (req, res) => {
  const card = await addCardToDeck(req.params.deckId, req.user.id, req.body);
  res.status(201).json({ card });
});

/**
 * PATCH /api/cards/:id
 * Body pre-validated by validateBody(updateCardSchema).
 */
export const update = asyncHandler(async (req, res) => {
  const card = await updateCard(req.params.id, req.user.id, req.body);
  res.status(200).json({ card });
});

/**
 * DELETE /api/cards/:id
 */
export const remove = asyncHandler(async (req, res) => {
  await deleteCard(req.params.id, req.user.id);
  res.status(204).send();
});
