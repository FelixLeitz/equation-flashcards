import { expect } from 'chai';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import passport from '../src/config/passport.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { requireAuth } from '../src/middleware/auth.js';
import { issueAuthCookie } from '../src/utils/auth-tokens.js';
import { User } from '../src/models/User.js';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase
} from './helpers/db.js';

// Single source of truth for the probe app.
function buildProbeApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(passport.initialize());

  // Local strategy probe.
  app.post(
    '/probe/local',
    passport.authenticate('local', { session: false }),
    (req, res) => res.json({ id: req.user.id })
  );

  // Issue a cookie for a known user (test-only helper route).
  app.post('/probe/issue/:id', async (req, res) => {
    const user = await User.findById(req.params.id);
    issueAuthCookie(res, user);
    res.json({ ok: true });
  });

  // Protected route using requireAuth (JWT strategy).
  app.get('/probe/protected', requireAuth, (req, res) =>
    res.json({ id: req.user.id })
  );

  // Error handling (must be last).
  app.use(errorHandler);

  return app;
}

describe('Passport strategies', () => {
  let app;

  before(async () => {
    await setupTestDatabase();
    await User.init();
    app = buildProbeApp(); // ✅ actually use it
  });

  after(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  async function createUser() {
    return User.create({
      email: 'ada@example.com',
      displayName: 'Ada',
      password: 'correcthorse9'
    });
  }

  describe('local strategy', () => {
    it('authenticates with correct credentials', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/probe/local')
        .send({ email: 'ada@example.com', password: 'correcthorse9' });
      expect(res.status).to.equal(200);
      expect(res.body.id).to.equal(user.id);
    });

    it('rejects an incorrect password with 401', async () => {
      await createUser();
      const res = await request(app)
        .post('/probe/local')
        .send({ email: 'ada@example.com', password: 'wrong' });
      expect(res.status).to.equal(401);
    });

    it('rejects an unknown email with 401', async () => {
      const res = await request(app)
        .post('/probe/local')
        .send({ email: 'nobody@example.com', password: 'whatever1' });
      expect(res.status).to.equal(401);
    });
  });

  describe('jwt strategy via requireAuth', () => {
    it('allows access with a valid auth cookie', async () => {
      const user = await createUser();
      const agent = request.agent(app);
      await agent.post(`/probe/issue/${user.id}`);
      const res = await agent.get('/probe/protected');
      expect(res.status).to.equal(200);
      expect(res.body.id).to.equal(user.id);
    });

    it('rejects access without a cookie (401)', async () => {
      const res = await request(app).get('/probe/protected');
      expect(res.status).to.equal(401);
      expect(res.body.error.code).to.equal('UNAUTHENTICATED');
    });

    it('rejects access with a garbage token (401)', async () => {
      const res = await request(app)
        .get('/probe/protected')
        .set('Cookie', 'token=not-a-real-jwt');
      expect(res.status).to.equal(401);
    });
  });
});
