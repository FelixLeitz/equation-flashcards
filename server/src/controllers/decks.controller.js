import { asyncHandler } from '../utils/async-handler.js';
import {
  createDeck,
  listDecksForUser,
  getDeckWithCards,
  updateDeck,
  deleteDeck
} from '../services/decks.service.js';

/**
 * POST /api/decks
 * Body pre-validated by validateBody(createDeckSchema).
 */
export const create = asyncHandler(async (req, res) => {
  const deck = await createDeck(req.user.id, req.body);
  res.status(201).json({ deck });
});

/**
 * GET /api/decks — list current user's decks (with cardCount).
 */
export const list = asyncHandler(async (req, res) => {
  const decks = await listDecksForUser(req.user.id);
  res.status(200).json({ decks });
});

/**
 * GET /api/decks/:id — deck + its cards (ownership enforced in service).
 */
export const getOne = asyncHandler(async (req, res) => {
  const { deck, cards } = await getDeckWithCards(req.params.id, req.user.id);
  res.status(200).json({ deck, cards });
});

/**
 * PATCH /api/decks/:id — update title/description.
 * Body pre-validated by validateBody(updateDeckSchema).
 */
export const update = asyncHandler(async (req, res) => {
  const deck = await updateDeck(req.params.id, req.user.id, req.body);
  res.status(200).json({ deck });
});

/**
 * DELETE /api/decks/:id — delete deck + cascade cards.
 */
export const remove = asyncHandler(async (req, res) => {
  await deleteDeck(req.params.id, req.user.id);
  res.status(204).send();
});
