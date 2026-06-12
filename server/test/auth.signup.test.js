import { expect } from 'chai';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase
} from './helpers/db.js';

describe('POST /api/auth/signup', () => {
  const app = createApp();

  before(async () => {
    await setupTestDatabase();
    await User.init(); // ensure the unique email index exists
  });

  after(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  const validBody = {
    email: 'ada@example.com',
    displayName: 'Ada',
    password: 'correcthorse9'
  };

  it('creates an account and returns 201 with the user (no hash)', async () => {
    const res = await request(app).post('/api/auth/signup').send(validBody);

    expect(res.status).to.equal(201);
    expect(res.body.user).to.include({
      email: 'ada@example.com',
      displayName: 'Ada'
    });
    expect(res.body.user).to.have.property('id');
    expect(res.body.user).to.not.have.property('passwordHash');
    expect(res.body.user).to.not.have.property('password');
  });

  it('persists the user with a hashed password', async () => {
    await request(app).post('/api/auth/signup').send(validBody);
    const stored = await User.findOne({ email: 'ada@example.com' }).select(
      '+passwordHash'
    );
    expect(stored).to.not.be.null;
    expect(stored.passwordHash).to.match(/^\$2[aby]\$/);
    expect(stored.passwordHash).to.not.equal('correcthorse9');
  });

  it('lowercases the email before storing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...validBody, email: 'ADA@Example.COM' });
    expect(res.status).to.equal(201);
    expect(res.body.user.email).to.equal('ada@example.com');
  });

  it('returns 409 for a duplicate email', async () => {
    await request(app).post('/api/auth/signup').send(validBody);
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...validBody, displayName: 'Ada Two' });

    expect(res.status).to.equal(409);
    expect(res.body.error.code).to.equal('CONFLICT');
  });

  it('returns 400 for an invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...validBody, email: 'not-an-email' });

    expect(res.status).to.equal(400);
    expect(res.body.error.code).to.equal('VALIDATION_ERROR');
    expect(res.body.error.details).to.be.an('array');
  });

  it('returns 400 for a password missing a digit', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...validBody, password: 'onlyletters' });

    expect(res.status).to.equal(400);
    expect(res.body.error.code).to.equal('VALIDATION_ERROR');
  });

  it('returns 400 for a password that is too short', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...validBody, password: 'short1' });

    expect(res.status).to.equal(400);
  });

  it('returns 400 for a missing displayName', async () => {
    const { displayName, ...withoutName } = validBody;
    const res = await request(app).post('/api/auth/signup').send(withoutName);

    expect(res.status).to.equal(400);
  });

  it('returns 400 for an empty request body', async () => {
    const res = await request(app).post('/api/auth/signup').send({});
    expect(res.status).to.equal(400);
  });
});
