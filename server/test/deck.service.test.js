import { expect } from 'chai';
import mongoose from 'mongoose';
import {
  createDeck,
  listDecksForUser,
  getDeckForUser,
  updateDeck,
  deleteDeck
} from '../src/services/decks.service.js';
import { createUser } from '../src/services/auth.service.js';
import { Deck } from '../src/models/Deck.js';
import { Card } from '../src/models/Card.js';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase
} from './helpers/db.js';

describe('decks.service', () => {
  let userId;
  let otherUserId;

  before(async () => {
    await setupTestDatabase();
    await Deck.init();
    await Card.init();
  });

  after(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    const user = await createUser({
      email: 'owner@example.com',
      displayName: 'Owner',
      password: 'correcthorse9'
    });
    const other = await createUser({
      email: 'other@example.com',
      displayName: 'Other',
      password: 'correcthorse9'
    });
    userId = user.id;
    otherUserId = other.id;
  });

  it('creates a deck owned by the user', async () => {
    const deck = await createDeck(userId, { title: 'Calc', description: 'd' });
    expect(deck.title).to.equal('Calc');
    expect(deck.ownerId.toString()).to.equal(userId);
  });

  it('lists only the user’s decks, with cardCount', async () => {
    const deck = await createDeck(userId, { title: 'A' });
    await createDeck(otherUserId, { title: 'NotMine' });
    await Card.create({ deckId: deck.id, front: 'q', back: 'a', order: 0 });

    const decks = await listDecksForUser(userId);
    expect(decks).to.have.lengthOf(1);
    expect(decks[0].title).to.equal('A');
    expect(decks[0].cardCount).to.equal(1);
  });

  it('getDeckForUser throws NotFoundError for another user’s deck', async () => {
    const deck = await createDeck(otherUserId, { title: 'Secret' });
    try {
      await getDeckForUser(deck.id, userId);
      expect.fail('expected NotFoundError');
    } catch (err) {
      expect(err.name).to.equal('NotFoundError');
      expect(err.statusCode).to.equal(404);
    }
  });

  it('updates title and description', async () => {
    const deck = await createDeck(userId, { title: 'Old' });
    const updated = await updateDeck(deck.id, userId, {
      title: 'New',
      description: 'desc'
    });
    expect(updated.title).to.equal('New');
    expect(updated.description).to.equal('desc');
  });

  it('deletes a deck and cascades its cards', async () => {
    const deck = await createDeck(userId, { title: 'ToDelete' });
    await Card.create({ deckId: deck.id, front: 'q', back: 'a', order: 0 });

    await deleteDeck(deck.id, userId);

    expect(await Deck.findById(deck.id)).to.be.null;
    const remaining = await Card.countDocuments({ deckId: deck.id });
    expect(remaining).to.equal(0);
  });

  it('cannot delete another user’s deck (NotFoundError)', async () => {
    const deck = await createDeck(otherUserId, { title: 'Secret' });
    try {
      await deleteDeck(deck.id, userId);
      expect.fail('expected NotFoundError');
    } catch (err) {
      expect(err.name).to.equal('NotFoundError');
    }
    // Confirm it still exists.
    expect(await Deck.findById(deck.id)).to.not.be.null;
  });
});
