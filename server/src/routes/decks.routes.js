import { Router } from 'express';
import {
  createDeckSchema,
  updateDeckSchema,
  createCardSchema
} from '@flashcards/shared';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validate-object-id.js';
import {
  create,
  list,
  getOne,
  update,
  remove
} from '../controllers/decks.controller.js';
import { create as createCard } from '../controllers/cards.controller.js';

const router = Router();

// All deck routes require authentication (REQ-AUTH-001).
router.use(requireAuth);

router.post('/', validateBody(createDeckSchema), create);
router.get('/', list);
router.get('/:id', validateObjectId(), getOne);
router.patch(
  '/:id',
  validateObjectId(),
  validateBody(updateDeckSchema),
  update
);
router.delete('/:id', validateObjectId(), remove);

// Nested: create a card within a deck (POST /api/decks/:deckId/cards)
router.post(
  '/:deckId/cards',
  validateObjectId('deckId'),
  validateBody(createCardSchema),
  createCard
);

export default router;
