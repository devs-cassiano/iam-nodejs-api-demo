const request = require('supertest');
const app = require('../../src/index');
const { sequelize } = require('../../src/models');

describe('Auth API', () => {
  it('should return 400 if email or password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toBe(400);
  });
});

afterAll(async () => {
  await sequelize.close();
});
