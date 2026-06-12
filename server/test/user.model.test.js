import { expect } from 'chai';
import { User } from '../src/models/User.js';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase
} from './helpers/db.js';

describe('User model', () => {
  before(async () => {
    await setupTestDatabase();
    // Ensure indexes (incl. the unique email index) are built before tests.
    await User.init();
  });

  after(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  const validUser = () => ({
    email: 'ada@example.com',
    displayName: 'Ada',
    password: 'correcthorse9'
  });

  it('hashes the password on save (never stores plaintext)', async () => {
    const user = await User.create(validUser());
    // Re-fetch with the hash explicitly selected.
    const stored = await User.findById(user.id).select('+passwordHash');
    expect(stored.passwordHash).to.be.a('string');
    expect(stored.passwordHash).to.not.equal('correcthorse9');
    expect(stored.passwordHash).to.match(/^\$2[aby]\$/); // bcrypt prefix
  });

  it('lowercases and trims the email', async () => {
    const user = await User.create({
      ...validUser(),
      email: '  ADA@Example.COM  '
    });
    expect(user.email).to.equal('ada@example.com');
  });

  it('excludes passwordHash from query results by default', async () => {
    await User.create(validUser());
    const user = await User.findOne({ email: 'ada@example.com' });
    expect(user.passwordHash).to.be.undefined;
  });

  it('excludes passwordHash and __v from JSON output, maps _id to id', async () => {
    const user = await User.create(validUser());
    const json = user.toJSON();
    expect(json).to.have.property('id');
    expect(json).to.not.have.property('_id');
    expect(json).to.not.have.property('__v');
    expect(json).to.not.have.property('passwordHash');
    expect(json.email).to.equal('ada@example.com');
  });

  it('comparePassword returns true for the correct password', async () => {
    await User.create(validUser());
    const user = await User.findOne({ email: 'ada@example.com' }).select(
      '+passwordHash'
    );
    expect(await user.comparePassword('correcthorse9')).to.be.true;
  });

  it('comparePassword returns false for an incorrect password', async () => {
    await User.create(validUser());
    const user = await User.findOne({ email: 'ada@example.com' }).select(
      '+passwordHash'
    );
    expect(await user.comparePassword('wrongpassword')).to.be.false;
  });

  it('rejects a duplicate email with a 11000 error', async () => {
    await User.create(validUser());
    try {
      await User.create({ ...validUser(), displayName: 'Ada Two' });
      expect.fail('Expected duplicate-key error was not thrown');
    } catch (err) {
      expect(err.code).to.equal(11000);
    }
  });

  it('re-hashes when the password is changed', async () => {
    const user = await User.create(validUser());
    const before = await User.findById(user.id).select('+passwordHash');
    const firstHash = before.passwordHash;

    before.password = 'newpassword1';
    await before.save();

    const after = await User.findById(user.id).select('+passwordHash');
    expect(after.passwordHash).to.not.equal(firstHash);
    expect(await after.comparePassword('newpassword1')).to.be.true;
  });
});
