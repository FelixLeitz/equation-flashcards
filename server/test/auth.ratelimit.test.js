import { expect } from 'chai';
import request from 'supertest';
import express from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Verifies the rate-limit BEHAVIOR using a limiter configured
 * identically to authLimiter but WITHOUT the test-skip, mounted on a probe app.
 * (The production authLimiter skips during NODE_ENV=test so other suites aren't
 * tripped; this test exercises the same configuration in isolation.)
 */
describe('Auth rate limiting', () => {
  function buildApp() {
    const app = express();
    app.use(express.json());

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) =>
        res.status(429).json({
          error: { code: 'RATE_LIMITED', message: 'Too many requests.' }
        })
    });

    app.post('/login', limiter, (req, res) =>
      res.status(401).json({ ok: false })
    );
    return app;
  }

  it('allows up to 5 attempts then returns 429', async () => {
    const app = buildApp();

    // First 5 attempts pass through to the handler (401 here).
    for (let i = 0; i < 5; i += 1) {
      const res = await request(app).post('/login').send({});
      expect(res.status).to.equal(401);
    }

    // The 6th attempt is rate-limited.
    const blocked = await request(app).post('/login').send({});
    expect(blocked.status).to.equal(429);
    expect(blocked.body.error.code).to.equal('RATE_LIMITED');
  });
});
