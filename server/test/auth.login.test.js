import { expect } from 'chai';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase
} from './helpers/db.js';

describe('Auth flow: login / logout / me', () => {
  const app = createApp();

  before(async () => {
    await setupTestDatabase();
    await User.init();
  });

  after(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  const creds = {
    email: 'ada@example.com',
    displayName: 'Ada',
    password: 'correcthorse9'
  };

  async function signup(agent = request(app)) {
    return agent.post('/api/auth/signup').send(creds);
  }

  // --- Signup auto-login ---
  describe('signup auto-login', () => {
    it('sets an auth cookie on signup', async () => {
      const res = await signup();
      expect(res.status).to.equal(201);
      const cookies = res.headers['set-cookie'] || [];
      const tokenCookie = cookies.find((c) => c.startsWith('token='));
      expect(tokenCookie, 'token cookie should be set').to.exist;
      expect(tokenCookie).to.include('HttpOnly');
      expect(tokenCookie).to.include('SameSite=Lax');
    });

    it('lets a freshly signed-up user hit /me with the returned cookie', async () => {
      const agent = request.agent(app);
      await signup(agent);
      const res = await agent.get('/api/auth/me');
      expect(res.status).to.equal(200);
      expect(res.body.user.email).to.equal('ada@example.com');
    });
  });

  // --- Login ---
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await signup();
    });

    it('logs in with correct credentials and sets a cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: creds.email, password: creds.password });

      expect(res.status).to.equal(200);
      expect(res.body.user).to.include({
        email: 'ada@example.com',
        displayName: 'Ada'
      });
      expect(res.body.user).to.not.have.property('passwordHash');

      const cookies = res.headers['set-cookie'] || [];
      expect(cookies.some((c) => c.startsWith('token='))).to.be.true;
    });

    it('returns a generic 401 for a wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: creds.email, password: 'wrongpassword1' });

      expect(res.status).to.equal(401);
      expect(res.body.error.code).to.equal('UNAUTHENTICATED');
      expect(res.body.error.message).to.equal('Invalid email or password.');
    });

    it('returns the same generic 401 for an unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'whatever12' });

      expect(res.status).to.equal(401);
      expect(res.body.error.message).to.equal('Invalid email or password.');
    });

    it('returns 400 for a malformed login body', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email' });

      expect(res.status).to.equal(400);
      expect(res.body.error.code).to.equal('VALIDATION_ERROR');
    });
  });

  // --- Logout ---
  describe('POST /api/auth/logout', () => {
    it('clears the auth cookie and returns 204', async () => {
      const agent = request.agent(app);
      await signup(agent);

      const res = await agent.post('/api/auth/logout');
      expect(res.status).to.equal(204);

      // After logout, /me should be unauthorized.
      const meRes = await agent.get('/api/auth/me');
      expect(meRes.status).to.equal(401);
    });
  });

  // --- /me ---
  describe('GET /api/auth/me', () => {
    it('returns 401 without an auth cookie', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).to.equal(401);
      expect(res.body.error.code).to.equal('UNAUTHENTICATED');
    });

    it('returns the user with a valid cookie', async () => {
      const agent = request.agent(app);
      await signup(agent);
      const res = await agent.get('/api/auth/me');
      expect(res.status).to.equal(200);
      expect(res.body.user.displayName).to.equal('Ada');
      expect(res.body.user).to.not.have.property('passwordHash');
    });

    it('returns 401 with a garbage token cookie', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'token=not-a-real-jwt');
      expect(res.status).to.equal(401);
    });
  });
});
