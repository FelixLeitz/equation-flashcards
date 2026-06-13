import { expect } from 'chai';
import { deleteAccount } from '../src/services/account.service.js';
import { createUser } from '../src/services/auth.service.js';
import { createDeck } from '../src/services/decks.service.js';
import { addCardToDeck } from '../src/services/cards.service.js';
import { User } from '../src/models/User.js';
import { Deck } from '../src/models/Deck.js';
import { Card } from '../src/models/Card.js';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase
} from './helpers/db.js';

describe('account.service', () => {
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

  it('deletes the user and cascades all their decks and cards', async () => {
    const user = await createUser({
      email: 'owner@example.com',
      displayName: 'Owner',
      password: 'correcthorse9'
    });
    const deck = await createDeck(user.id, { title: 'D' });
    await addCardToDeck(deck.id, user.id, { front: 'q', back: 'a' });
    await addCardToDeck(deck.id, user.id, { front: 'q2', back: 'a2' });

    await deleteAccount(user.id);

    expect(await User.findById(user.id)).to.be.null;
    expect(await Deck.countDocuments({ ownerId: user.id })).to.equal(0);
    expect(await Card.countDocuments({ deckId: deck.id })).to.equal(0);
  });

  it('does not touch other users’ data', async () => {
    const a = await createUser({
      email: 'a@example.com',
      displayName: 'A',
      password: 'correcthorse9'
    });
    const b = await createUser({
      email: 'b@example.com',
      displayName: 'B',
      password: 'correcthorse9'
    });
    const aDeck = await createDeck(a.id, { title: 'A-Deck' });
    await addCardToDeck(aDeck.id, a.id, { front: 'q', back: 'a' });
    const bDeck = await createDeck(b.id, { title: 'B-Deck' });
    await addCardToDeck(bDeck.id, b.id, { front: 'q', back: 'a' });

    await deleteAccount(a.id);

    // B's data is intact.
    expect(await User.findById(b.id)).to.not.be.null;
    expect(await Deck.countDocuments({ ownerId: b.id })).to.equal(1);
    expect(await Card.countDocuments({ deckId: bDeck.id })).to.equal(1);
  });

  it('throws NotFoundError for a non-existent user', async () => {
    try {
      await deleteAccount('507f1f77bcf86cd799439011');
      expect.fail('expected NotFoundError');
    } catch (err) {
      expect(err.name).to.equal('NotFoundError');
    }
  });

  it('handles a user with no decks gracefully', async () => {
    const user = await createUser({
      email: 'empty@example.com',
      displayName: 'Empty',
      password: 'correcthorse9'
    });
    await deleteAccount(user.id);
    expect(await User.findById(user.id)).to.be.null;
  });
});
