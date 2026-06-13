import { expect } from 'chai';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Deck } from '../src/models/Deck.js';
import { Card } from '../src/models/Card.js';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase
} from './helpers/db.js';
import { createAuthedAgent } from './helpers/auth.js';

describe('Account routes', () => {
  const app = createApp();

  before(async () => {
    await setupTestDatabase();
    await User.init();
    await Deck.init();
    await Card.init();
  });

  after(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('requires authentication (401 without cookie)', async () => {
    const res = await request(app).delete('/api/account');
    expect(res.status).to.equal(401);
  });

  it('deletes the account, cascades data, and clears the cookie (204)', async () => {
    const { agent, user } = await createAuthedAgent(app);

    // Create some owned data.
    const deckRes = await agent.post('/api/decks').send({ title: 'D' });
    const deckId = deckRes.body.deck.id;
    await agent
      .post(`/api/decks/${deckId}/cards`)
      .send({ front: 'q', back: 'a' });

    const res = await agent.delete('/api/account');
    expect(res.status).to.equal(204);

    // Cookie cleared -> subsequent authed request fails.
    const me = await agent.get('/api/auth/me');
    expect(me.status).to.equal(401);

    // Data is gone.
    expect(await User.findById(user.id)).to.be.null;
    expect(await Deck.countDocuments({ ownerId: user.id })).to.equal(0);
    expect(await Card.countDocuments({ deckId })).to.equal(0);
  });

  it('cannot log in again after deletion', async () => {
    const { agent } = await createAuthedAgent(app, {
      email: 'gone@example.com'
    });
    await agent.delete('/api/account');

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'gone@example.com', password: 'correcthorse9' });
    expect(login.status).to.equal(401);
  });
});
