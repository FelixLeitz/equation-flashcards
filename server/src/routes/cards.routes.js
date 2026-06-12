import { Router } from 'express';
import { updateCardSchema } from '@flashcards/shared';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validate-object-id.js';
import { update, remove } from '../controllers/cards.controller.js';

const router = Router();

router.use(requireAuth);

// PATCH /api/cards/:id
router.patch(
  '/:id',
  validateObjectId(),
  validateBody(updateCardSchema),
  update
);

// DELETE /api/cards/:id
router.delete('/:id', validateObjectId(), remove);

export default router;
