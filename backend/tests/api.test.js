const request = require('supertest');
const { app } = require('../src/server');

describe('API smoke tests', () => {
  it('health endpoint returns status ok', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
  });

  it('login accepts password alias and returns a token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'espacovida@gmail.com', password: 'vida22' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.usuario).toBeDefined();
  });
});
