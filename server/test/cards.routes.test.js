import { expect } from 'chai';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Card } from '../src/models/Card.js';
import { Deck } from '../src/models/Deck.js';
import { User } from '../src/models/User.js';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase
} from './helpers/db.js';
import { createAuthedAgent } from './helpers/auth.js';

describe('Card routes', () => {
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

  async function setupDeck(agent) {
    const res = await agent.post('/api/decks').send({ title: 'Deck' });
    return res.body.deck.id;
  }

  it('requires auth to create a card (401)', async () => {
    const res = await request(app)
      .post('/api/decks/507f1f77bcf86cd799439011/cards')
      .send({ front: 'a', back: 'b' });
    expect(res.status).to.equal(401);
  });

  it('creates a card in an owned deck (201)', async () => {
    const { agent } = await createAuthedAgent(app);
    const deckId = await setupDeck(agent);

    const res = await agent
      .post(`/api/decks/${deckId}/cards`)
      .send({ front: 'What is $2+2$?', back: '$4$' });

    expect(res.status).to.equal(201);
    expect(res.body.card).to.include({ front: 'What is $2+2$?', back: '$4$' });
    expect(res.body.card).to.have.property('id');
    expect(res.body.card.order).to.equal(0);
  });

  it('accepts an empty card (both faces default to empty string)', async () => {
    const { agent } = await createAuthedAgent(app);
    const deckId = await setupDeck(agent);
    const res = await agent.post(`/api/decks/${deckId}/cards`).send({});
    expect(res.status).to.equal(201);
    expect(res.body.card.front).to.equal('');
    expect(res.body.card.back).to.equal('');
  });

  it('rejects a card face over the length limit (400)', async () => {
    const { agent } = await createAuthedAgent(app);
    const deckId = await setupDeck(agent);
    const tooLong = 'x'.repeat(4001);
    const res = await agent
      .post(`/api/decks/${deckId}/cards`)
      .send({ front: tooLong, back: '' });
    expect(res.status).to.equal(400);
    expect(res.body.error.code).to.equal('VALIDATION_ERROR');
  });

  it('returns the card in deck detail, in order', async () => {
    const { agent } = await createAuthedAgent(app);
    const deckId = await setupDeck(agent);
    await agent
      .post(`/api/decks/${deckId}/cards`)
      .send({ front: '1', back: '' });
    await agent
      .post(`/api/decks/${deckId}/cards`)
      .send({ front: '2', back: '' });

    const res = await agent.get(`/api/decks/${deckId}`);
    expect(res.body.cards).to.have.lengthOf(2);
    expect(res.body.cards[0].front).to.equal('1');
    expect(res.body.cards[1].front).to.equal('2');
  });

  it('updates a card (PATCH)', async () => {
    const { agent } = await createAuthedAgent(app);
    const deckId = await setupDeck(agent);
    const created = await agent
      .post(`/api/decks/${deckId}/cards`)
      .send({ front: 'old', back: 'old' });
    const cardId = created.body.card.id;

    const res = await agent
      .patch(`/api/cards/${cardId}`)
      .send({ front: 'new' });
    expect(res.status).to.equal(200);
    expect(res.body.card.front).to.equal('new');
    expect(res.body.card.back).to.equal('old');
  });

  it('rejects an empty PATCH body (400)', async () => {
    const { agent } = await createAuthedAgent(app);
    const deckId = await setupDeck(agent);
    const created = await agent
      .post(`/api/decks/${deckId}/cards`)
      .send({ front: 'a', back: 'b' });
    const res = await agent
      .patch(`/api/cards/${created.body.card.id}`)
      .send({});
    expect(res.status).to.equal(400);
  });

  it('deletes a card (204)', async () => {
    const { agent } = await createAuthedAgent(app);
    const deckId = await setupDeck(agent);
    const created = await agent
      .post(`/api/decks/${deckId}/cards`)
      .send({ front: 'a', back: 'b' });
    const cardId = created.body.card.id;

    const res = await agent.delete(`/api/cards/${cardId}`);
    expect(res.status).to.equal(204);
    expect(await Card.findById(cardId)).to.be.null;
  });

  it('returns 404 for a malformed card id', async () => {
    const { agent } = await createAuthedAgent(app);
    const res = await agent.patch('/api/cards/not-valid').send({ front: 'x' });
    expect(res.status).to.equal(404);
  });

  it('returns 404 for a non-existent card id', async () => {
    const { agent } = await createAuthedAgent(app);
    const res = await agent
      .patch('/api/cards/507f1f77bcf86cd799439011')
      .send({ front: 'x' });
    expect(res.status).to.equal(404);
  });

  // --- Cross-user authorization via parent deck (REQ-AUTH-002) ---
  describe('ownership enforcement', () => {
    it('cannot create a card in another user’s deck (404)', async () => {
      const { agent: alice } = await createAuthedAgent(app, {
        email: 'alice@example.com'
      });
      const { agent: bob } = await createAuthedAgent(app, {
        email: 'bob@example.com'
      });
      const deckId = await setupDeck(alice);

      const res = await bob
        .post(`/api/decks/${deckId}/cards`)
        .send({ front: 'hax', back: '' });
      expect(res.status).to.equal(404);
    });

    it('cannot update another user’s card (404)', async () => {
      const { agent: alice } = await createAuthedAgent(app, {
        email: 'alice@example.com'
      });
      const { agent: bob } = await createAuthedAgent(app, {
        email: 'bob@example.com'
      });
      const deckId = await setupDeck(alice);
      const created = await alice
        .post(`/api/decks/${deckId}/cards`)
        .send({ front: 'a', back: 'b' });

      const res = await bob
        .patch(`/api/cards/${created.body.card.id}`)
        .send({ front: 'hax' });
      expect(res.status).to.equal(404);
    });

    it('cannot delete another user’s card (404)', async () => {
      const { agent: alice } = await createAuthedAgent(app, {
        email: 'alice@example.com'
      });
      const { agent: bob } = await createAuthedAgent(app, {
        email: 'bob@example.com'
      });
      const deckId = await setupDeck(alice);
      const created = await alice
        .post(`/api/decks/${deckId}/cards`)
        .send({ front: 'a', back: 'b' });
      const cardId = created.body.card.id;

      const res = await bob.delete(`/api/cards/${cardId}`);
      expect(res.status).to.equal(404);
      // Confirm the card still exists (Bob couldn't delete it).
      expect(await Card.findById(cardId)).to.not.be.null;
    });
  });
});
