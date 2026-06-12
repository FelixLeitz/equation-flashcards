import { Router } from 'express';

const router = Router();

/**
 * GET /api/health
 * Unauthenticated liveness check commomly used by hosting-provider monitors.
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
