import request from 'supertest';

/**
 * Create a signed-up, logged-in supertest agent (cookie persisted).
 * Returns { agent, user } where user is the response body's user.
 */
export async function createAuthedAgent(app, overrides = {}) {
  const agent = request.agent(app);
  const body = {
    email: 'user@example.com',
    displayName: 'User',
    password: 'correcthorse9',
    ...overrides
  };
  const res = await agent.post('/api/auth/signup').send(body);
  return { agent, user: res.body.user };
}
