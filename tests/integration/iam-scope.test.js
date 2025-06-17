process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../../src/index');
const { User, Role, sequelize } = require('../../src/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function createUserWithRole(email, password, roleName, createdBy = null) {
  // Cria usuário
  await User.create({ email, password: bcrypt.hashSync(password, 10), createdBy });
  // Busca usuário do banco para garantir persistência
  const user = await User.findOne({ where: { email } });
  let [role] = await Role.findOrCreate({ where: { name: roleName }, defaults: { createdBy } });
  await user.addRole(role);
  const token = jwt.sign({ id: user.id, email: user.email, role: roleName }, process.env.JWT_SECRET, { expiresIn: '1d' });
  return { user, role, token };
}

describe('IAM Escopo Root/Admin/User', () => {
  let root, admin, user, rootToken, adminToken, userToken;
  beforeAll(async () => {
    await User.destroy({ where: {}, truncate: true, cascade: true });
    await Role.destroy({ where: {}, truncate: true, cascade: true });
    ({ user: root, token: rootToken } = await createUserWithRole('root@example.com', 'rootpass', 'Root', null));
    ({ user: admin, token: adminToken } = await createUserWithRole('admin@example.com', 'adminpass', 'Admin', root.id));
    ({ user: user, token: userToken } = await createUserWithRole('user@example.com', 'userpass', 'User', admin.id));
  });

  it('Root pode listar todos os usuários', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${rootToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });

  it('Admin só lista usuários criados por ele', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].email).toBe('user@example.com');
  });

  it('User não pode listar usuários', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('Admin não pode remover usuário criado pelo root', async () => {
    const res = await request(app).delete(`/api/users/${root.id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('Root pode remover qualquer usuário', async () => {
    const res = await request(app).delete(`/api/users/${user.id}`).set('Authorization', `Bearer ${rootToken}`);
    expect(res.statusCode).toBe(204);
  });

  afterAll(async () => {
    await sequelize.close();
  });
});
