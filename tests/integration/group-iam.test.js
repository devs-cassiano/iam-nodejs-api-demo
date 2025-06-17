process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../../src/index');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../../src/models');

async function registerUser(email, password, token) {
  let reqBuilder = request(app)
    .post('/api/auth/register')
    .send({ email, password });
  if (token) reqBuilder = reqBuilder.set('Authorization', `Bearer ${token}`);
  const res = await reqBuilder;
  return res.body;
}

describe('IAM Grupos e Atribuições', () => {
  let root, admin, user, rootToken, adminToken, userToken, group;
  beforeAll(async () => {
    const { Group, Role, Policy, Permission, User } = require('../../src/models');
    await Group.destroy({ where: {}, truncate: true, cascade: true });
    await Role.destroy({ where: {}, truncate: true, cascade: true });
    await Policy.destroy({ where: {}, truncate: true, cascade: true });
    await Permission.destroy({ where: {}, truncate: true, cascade: true });
    await User.destroy({ where: {}, truncate: true, cascade: true });
    // Cria root sem autenticação
    root = await registerUser('root-group-test@example.com', 'rootpass');
    // Garante que o root tenha a role Root e remova User
    let rootRole = await Role.findOne({ where: { name: 'Root' } });
    if (!rootRole) rootRole = await Role.create({ name: 'Root', createdBy: null });
    const rootUser = await User.findOne({ where: { email: 'root-group-test@example.com' } });
    await rootUser.setRoles([rootRole]);
    // Cria e associa policy RootFullAccess à role Root
    const rootPolicy = await Policy.create({
      name: 'RootFullAccess',
      document: {
        Version: '2025-06-17',
        Statement: [
          { Effect: 'Allow', Action: '*', Resource: '*' },
          { Effect: 'Allow', Action: 'groups:addUser', Resource: '*' }
        ]
      },
      createdBy: null
    });
    await rootRole.setPolicies([rootPolicy]);
    rootToken = jwt.sign({ id: root.id, email: root.email, role: 'Root' }, process.env.JWT_SECRET);
    // Cria admin autenticado como root
    admin = await registerUser('admin-group-test@example.com', 'adminpass', rootToken);
    let adminRole = await Role.findOne({ where: { name: 'Admin' } });
    if (!adminRole) adminRole = await Role.create({ name: 'Admin', createdBy: null });
    const adminUser = await User.findOne({ where: { email: 'admin-group-test@example.com' } });
    await adminUser.setRoles([adminRole]);
    // Cria e associa policy AdminFullAccess à role Admin
    const adminPolicy = await Policy.create({
      name: 'AdminFullAccess',
      document: {
        Version: '2025-06-17',
        Statement: [
          { Effect: 'Allow', Action: '*', Resource: '*' },
          { Effect: 'Allow', Action: 'groups:addUser', Resource: '*' }
        ]
      },
      createdBy: null
    });
    await adminRole.setPolicies([adminPolicy]);
    adminToken = jwt.sign({ id: admin.id, email: admin.email, role: 'Admin' }, process.env.JWT_SECRET);
    // Cria user autenticado como admin
    user = await registerUser('user-group-test@example.com', 'userpass', adminToken);
    userToken = jwt.sign({ id: user.id, email: user.email, role: 'User' }, process.env.JWT_SECRET);
  });

  it('Root pode criar grupo e adicionar usuário', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${rootToken}`)
      .send({ name: 'root-group' });
    expect(res.statusCode).toBe(201);
    group = res.body;
    const addUser = await request(app)
      .post(`/api/groups/${group.id}/users`)
      .set('Authorization', `Bearer ${rootToken}`)
      .send({ userId: user.id });
    expect(addUser.statusCode).toBe(204);
  });

  it('Admin pode criar grupo e adicionar apenas seus usuários', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'admin-group' });
    expect(res.statusCode).toBe(201);
    const groupId = res.body.id;
    const addUser = await request(app)
      .post(`/api/groups/${groupId}/users`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: user.id });
    expect(addUser.statusCode).toBe(204);
  });

  it('User pode consultar seus próprios grupos', async () => {
    const res = await request(app)
      .get('/api/users/me/groups')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  afterAll(async () => {
    await sequelize.close();
  });
});
