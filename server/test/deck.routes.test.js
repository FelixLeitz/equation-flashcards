import { expect } from 'chai';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Deck } from '../src/models/Deck.js';
import { Card } from '../src/models/Card.js';
import { User } from '../src/models/User.js';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase
} from './helpers/db.js';
import { createAuthedAgent } from './helpers/auth.js';

describe('Deck routes', () => {
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
    const res = await request(app).get('/api/decks');
    expect(res.status).to.equal(401);
  });

  it('creates a deck (201)', async () => {
    const { agent } = await createAuthedAgent(app);
    const res = await agent
      .post('/api/decks')
      .send({ title: 'Calculus', description: 'Derivatives' });

    expect(res.status).to.equal(201);
    expect(res.body.deck).to.include({ title: 'Calculus' });
    expect(res.body.deck).to.have.property('id');
  });

  it('rejects an invalid deck body (400)', async () => {
    const { agent } = await createAuthedAgent(app);
    const res = await agent.post('/api/decks').send({ title: '' });
    expect(res.status).to.equal(400);
    expect(res.body.error.code).to.equal('VALIDATION_ERROR');
  });

  it('lists the user’s decks', async () => {
    const { agent } = await createAuthedAgent(app);
    await agent.post('/api/decks').send({ title: 'One' });
    await agent.post('/api/decks').send({ title: 'Two' });

    const res = await agent.get('/api/decks');
    expect(res.status).to.equal(200);
    expect(res.body.decks).to.have.lengthOf(2);
    expect(res.body.decks[0]).to.have.property('cardCount');
  });

  it('gets a single deck with its cards', async () => {
    const { agent } = await createAuthedAgent(app);
    const created = await agent.post('/api/decks').send({ title: 'WithCards' });
    const deckId = created.body.deck.id;
    await Card.create({ deckId, front: 'q', back: 'a', order: 0 });

    const res = await agent.get(`/api/decks/${deckId}`);
    expect(res.status).to.equal(200);
    expect(res.body.deck.id).to.equal(deckId);
    expect(res.body.cards).to.have.lengthOf(1);
  });

  it('updates a deck (PATCH)', async () => {
    const { agent } = await createAuthedAgent(app);
    const created = await agent.post('/api/decks').send({ title: 'Old' });
    const deckId = created.body.deck.id;

    const res = await agent
      .patch(`/api/decks/${deckId}`)
      .send({ title: 'New', description: 'updated' });

    expect(res.status).to.equal(200);
    expect(res.body.deck.title).to.equal('New');
    expect(res.body.deck.description).to.equal('updated');
  });

  it('rejects a PATCH with an empty body (400)', async () => {
    const { agent } = await createAuthedAgent(app);
    const created = await agent.post('/api/decks').send({ title: 'X' });
    const deckId = created.body.deck.id;

    const res = await agent.patch(`/api/decks/${deckId}`).send({});
    expect(res.status).to.equal(400);
    expect(res.body.error.code).to.equal('VALIDATION_ERROR');
  });

  it('deletes a deck and cascades its cards (204)', async () => {
    const { agent } = await createAuthedAgent(app);
    const created = await agent.post('/api/decks').send({ title: 'ToDelete' });
    const deckId = created.body.deck.id;
    await Card.create({ deckId, front: 'q', back: 'a', order: 0 });

    const res = await agent.delete(`/api/decks/${deckId}`);
    expect(res.status).to.equal(204);

    expect(await Deck.findById(deckId)).to.be.null;
    expect(await Card.countDocuments({ deckId })).to.equal(0);
  });

  it('returns 404 for a malformed deck id', async () => {
    const { agent } = await createAuthedAgent(app);
    const res = await agent.get('/api/decks/not-a-valid-id');
    expect(res.status).to.equal(404);
    expect(res.body.error.code).to.equal('NOT_FOUND');
  });

  it('returns 404 for a non-existent deck id', async () => {
    const { agent } = await createAuthedAgent(app);
    const res = await agent.get('/api/decks/507f1f77bcf86cd799439011');
    expect(res.status).to.equal(404);
  });

  // --- Cross-user authorization (REQ-AUTH-002) ---
  describe('ownership enforcement', () => {
    it('cannot read another user’s deck (404, not 403)', async () => {
      const { agent: alice } = await createAuthedAgent(app, {
        email: 'alice@example.com'
      });
      const { agent: bob } = await createAuthedAgent(app, {
        email: 'bob@example.com'
      });

      const created = await alice.post('/api/decks').send({ title: 'Private' });
      const deckId = created.body.deck.id;

      const res = await bob.get(`/api/decks/${deckId}`);
      expect(res.status).to.equal(404);
    });

    it('cannot update another user’s deck (404)', async () => {
      const { agent: alice } = await createAuthedAgent(app, {
        email: 'alice@example.com'
      });
      const { agent: bob } = await createAuthedAgent(app, {
        email: 'bob@example.com'
      });

      const created = await alice.post('/api/decks').send({ title: 'Private' });
      const deckId = created.body.deck.id;

      const res = await bob
        .patch(`/api/decks/${deckId}`)
        .send({ title: 'Hax' });
      expect(res.status).to.equal(404);

      // Confirm unchanged.
      const check = await alice.get(`/api/decks/${deckId}`);
      expect(check.body.deck.title).to.equal('Private');
    });

    it('cannot delete another user’s deck (404)', async () => {
      const { agent: alice } = await createAuthedAgent(app, {
        email: 'alice@example.com'
      });
      const { agent: bob } = await createAuthedAgent(app, {
        email: 'bob@example.com'
      });

      const created = await alice.post('/api/decks').send({ title: 'Private' });
      const deckId = created.body.deck.id;

      const res = await bob.delete(`/api/decks/${deckId}`);
      expect(res.status).to.equal(404);
      expect(await Deck.findById(deckId)).to.not.be.null;
    });
  });
});
