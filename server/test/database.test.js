import { expect } from 'chai';
import mongoose from 'mongoose';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase
} from './helpers/db.js';

describe('Database connection', () => {
  before(async () => {
    await setupTestDatabase();
  });

  after(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('establishes a ready connection (readyState 1)', () => {
    // 1 === connected
    expect(mongoose.connection.readyState).to.equal(1);
  });

  it('can write and read a document', async () => {
    const TestModel = mongoose.model(
      'ConnTest',
      new mongoose.Schema({ name: String })
    );
    await TestModel.create({ name: 'hello' });
    const found = await TestModel.findOne({ name: 'hello' });
    expect(found).to.not.be.null;
    expect(found.name).to.equal('hello');
  });
});
