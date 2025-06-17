process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../../src/index');
const { User, Role, Policy, sequelize } = require('../../src/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Utilitário para criar usuário, role, policy e vincular tudo
async function setupUserWithPolicy() {
  const user = await User.create({ email: 'test@example.com', password: bcrypt.hashSync('123456', 10) });
  const role = await Role.create({ name: 'SecureAccessRole' });
  const policy = await Policy.create({
    name: 'SecureResourceFullAccess',
    document: {
      Version: '2025-06-16',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['read:secure-resource', 'write:secure-resource'],
          Resource: 'arn:myapi:resource:secure'
        }
      ]
    }
  });
  await role.addPolicy(policy);
  await user.addRole(role);
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
  return { user, token };
}

describe('Secure Resource IAM Policy', () => {
  let token;
  beforeAll(async () => {
    await User.destroy({ where: {}, truncate: true, cascade: true });
    await Role.destroy({ where: {}, truncate: true, cascade: true });
    await Policy.destroy({ where: {}, truncate: true, cascade: true });
    ({ token } = await setupUserWithPolicy());
  });

  it('permite acesso GET ao recurso seguro com policy correta', async () => {
    const res = await request(app)
      .get('/api/secure/resource')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Acesso permitido/);
  });

  it('permite acesso POST ao recurso seguro com policy correta', async () => {
    const res = await request(app)
      .post('/api/secure/resource')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Ação de escrita permitida/);
  });

  it('nega acesso sem token', async () => {
    const res = await request(app).get('/api/secure/resource');
    expect(res.statusCode).toBe(401);
  });

  afterAll(async () => {
    await sequelize.close();
  });
});
