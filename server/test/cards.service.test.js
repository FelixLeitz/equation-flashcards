import { expect } from 'chai';
import {
  addCardToDeck,
  updateCard,
  deleteCard
} from '../src/services/cards.service.js';
import { createDeck } from '../src/services/decks.service.js';
import { createUser } from '../src/services/auth.service.js';
import { Card } from '../src/models/Card.js';
import { Deck } from '../src/models/Deck.js';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase
} from './helpers/db.js';

describe('cards.service', () => {
  let userId;
  let otherUserId;
  let deckId;

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
    const owner = await createUser({
      email: 'owner@example.com',
      displayName: 'Owner',
      password: 'correcthorse9'
    });
    const other = await createUser({
      email: 'other@example.com',
      displayName: 'Other',
      password: 'correcthorse9'
    });
    userId = owner.id;
    otherUserId = other.id;
    const deck = await createDeck(userId, { title: 'Deck' });
    deckId = deck.id;
  });

  it('adds a card to an owned deck', async () => {
    const card = await addCardToDeck(deckId, userId, {
      front: 'What is $2+2$?',
      back: '$4$'
    });
    expect(card.front).to.equal('What is $2+2$?');
    expect(card.order).to.equal(0);
    expect(card.deckId.toString()).to.equal(deckId);
  });

  it('assigns stable, incrementing order', async () => {
    const c0 = await addCardToDeck(deckId, userId, { front: 'a', back: '1' });
    const c1 = await addCardToDeck(deckId, userId, { front: 'b', back: '2' });
    const c2 = await addCardToDeck(deckId, userId, { front: 'c', back: '3' });
    expect(c0.order).to.equal(0);
    expect(c1.order).to.equal(1);
    expect(c2.order).to.equal(2);
  });

  it('persists malformed LaTeX as-is (REQ-CARD-007)', async () => {
    const card = await addCardToDeck(deckId, userId, {
      front: '$\\frac{1}{$',
      back: ''
    });
    expect(card.front).to.equal('$\\frac{1}{$');
  });

  it('cannot add a card to another user’s deck (NotFoundError)', async () => {
    try {
      await addCardToDeck(deckId, otherUserId, { front: 'x', back: 'y' });
      expect.fail('expected NotFoundError');
    } catch (err) {
      expect(err.name).to.equal('NotFoundError');
    }
  });

  it('updates a card’s front and back', async () => {
    const card = await addCardToDeck(deckId, userId, { front: 'a', back: 'b' });
    const updated = await updateCard(card.id, userId, {
      front: 'A',
      back: 'B'
    });
    expect(updated.front).to.equal('A');
    expect(updated.back).to.equal('B');
  });

  it('cannot update a card in another user’s deck (NotFoundError)', async () => {
    const card = await addCardToDeck(deckId, userId, { front: 'a', back: 'b' });
    try {
      await updateCard(card.id, otherUserId, { front: 'hax' });
      expect.fail('expected NotFoundError');
    } catch (err) {
      expect(err.name).to.equal('NotFoundError');
    }
  });

  it('deletes an owned card', async () => {
    const card = await addCardToDeck(deckId, userId, { front: 'a', back: 'b' });
    await deleteCard(card.id, userId);
    expect(await Card.findById(card.id)).to.be.null;
  });

  it('cannot delete a card in another user’s deck (NotFoundError)', async () => {
    const card = await addCardToDeck(deckId, userId, { front: 'a', back: 'b' });
    try {
      await deleteCard(card.id, otherUserId);
      expect.fail('expected NotFoundError');
    } catch (err) {
      expect(err.name).to.equal('NotFoundError');
    }
    expect(await Card.findById(card.id)).to.not.be.null;
  });
});
