import { Router } from 'express';
import { signupSchema } from '@flashcards/shared';
import { validateBody } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rate-limit.js';
import { signup } from '../controllers/auth.controller.js';

const router = Router();

// POST /api/auth/signup
router.post('/signup', authLimiter, validateBody(signupSchema), signup);

export default router;
