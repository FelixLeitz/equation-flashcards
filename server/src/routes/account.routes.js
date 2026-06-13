import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { remove } from '../controllers/account.controller.js';

const router = Router();

router.use(requireAuth);

// DELETE /api/account — delete current user + cascade their data
router.delete('/', remove);

export default router;
