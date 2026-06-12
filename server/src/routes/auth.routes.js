import { Router } from 'express';
import { signupSchema, loginSchema } from '@flashcards/shared';
import { validateBody } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rate-limit.js';
import { requireAuth } from '../middleware/auth.js';
import { signup, login, logout, me } from '../controllers/auth.controller.js';

const router = Router();

// POST /api/auth/signup — create account + auto-login
router.post('/signup', authLimiter, validateBody(signupSchema), signup);

// POST /api/auth/login — verify credentials, set auth cookie
router.post('/login', authLimiter, validateBody(loginSchema), login);

// POST /api/auth/logout — clear auth cookie
router.post('/logout', logout);

// GET /api/auth/me — current user (protected)
router.get('/me', requireAuth, me);

export default router;
