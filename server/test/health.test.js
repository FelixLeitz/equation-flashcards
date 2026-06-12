import { expect } from 'chai';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('GET /api/health', () => {
  const app = createApp();

  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('status', 'ok');
    expect(res.body).to.have.property('timestamp');
  });

  it('returns 404 with a JSON error for unknown routes', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).to.equal(404);
    expect(res.body.error).to.have.property('code', 'NOT_FOUND');
  });
});
