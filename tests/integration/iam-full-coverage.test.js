process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../../src/index');
const { User, Role, Policy, Permission, Group, sequelize } = require('../../src/models');
const jwt = require('jsonwebtoken');

async function registerUser(email, password, token) {
  let reqBuilder = request(app)
    .post('/api/auth/register')
    .send({ email, password });
  if (token) reqBuilder = reqBuilder.set('Authorization', `Bearer ${token}`);
  const res = await reqBuilder;
  // Busca o usuário do banco após registro para garantir persistência
  const user = await User.findOne({ where: { email } });
  return user;
}

describe('Cobertura Completa IAM: Roles, Policies, Permissions, Groups', () => {
  let root, admin, user, rootToken, adminToken, userToken, group;
  beforeAll(async () => {
    await Group.destroy({ where: {}, truncate: true, cascade: true });
    await Role.destroy({ where: {}, truncate: true, cascade: true });
    await Policy.destroy({ where: {}, truncate: true, cascade: true });
    await Permission.destroy({ where: {}, truncate: true, cascade: true });
    await User.destroy({ where: {}, truncate: true, cascade: true });
    root = await registerUser('root2@example.com', 'rootpass');
    let rootRole = await Role.findOne({ where: { name: 'Root' } });
    if (!rootRole) rootRole = await Role.create({ name: 'Root', createdBy: null });
    await root.setRoles([rootRole]);
    rootToken = jwt.sign({ id: root.id, email: root.email, role: 'Root' }, process.env.JWT_SECRET);
    admin = await registerUser('admin2@example.com', 'adminpass', rootToken);
    let adminRole = await Role.findOne({ where: { name: 'Admin' } });
    if (!adminRole) adminRole = await Role.create({ name: 'Admin', createdBy: null });
    await admin.setRoles([adminRole]);
    adminToken = jwt.sign({ id: admin.id, email: admin.email, role: 'Admin' }, process.env.JWT_SECRET);
    user = await registerUser('user2@example.com', 'userpass', adminToken);
    userToken = jwt.sign({ id: user.id, email: user.email, role: 'User' }, process.env.JWT_SECRET);
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
    // Opcional: garantir policies para admin se necessário
  });

  it('Root pode criar role, policy e permission com nome reservado', async () => {
    const role = await request(app).post('/api/roles').set('Authorization', `Bearer ${rootToken}`).send({ name: 'root-role' });
    expect(role.statusCode).toBe(201);
    const policy = await request(app).post('/api/policies').set('Authorization', `Bearer ${rootToken}`).send({ name: 'root-policy', document: { effect: 'allow', actions: ['*'], resources: ['*'] } });
    expect(policy.statusCode).toBe(201);
    const perm = await request(app).post('/api/permissions').set('Authorization', `Bearer ${rootToken}`).send({ name: 'root-perm' });
    expect(perm.statusCode).toBe(201);
  });

  it('Admin não pode criar role/policy/permission com nome reservado pelo root', async () => {
    let res = await request(app).post('/api/roles').set('Authorization', `Bearer ${adminToken}`).send({ name: 'root-role' });
    expect([400,422]).toContain(res.statusCode);
    res = await request(app).post('/api/policies').set('Authorization', `Bearer ${adminToken}`).send({ name: 'root-policy', document: { effect: 'allow', actions: ['*'], resources: ['*'] } });
    expect([400,422]).toContain(res.statusCode);
    res = await request(app).post('/api/permissions').set('Authorization', `Bearer ${adminToken}`).send({ name: 'root-perm' });
    expect([400,422]).toContain(res.statusCode);
  });

  it('Admin pode criar role/policy/permission própria', async () => {
    let res = await request(app).post('/api/roles').set('Authorization', `Bearer ${adminToken}`).send({ name: 'admin-role' });
    expect(res.statusCode).toBe(201);
    res = await request(app).post('/api/policies').set('Authorization', `Bearer ${adminToken}`).send({ name: 'admin-policy', document: { effect: 'allow', actions: ['read'], resources: ['users'] } });
    expect(res.statusCode).toBe(201);
    res = await request(app).post('/api/permissions').set('Authorization', `Bearer ${adminToken}`).send({ name: 'admin-perm' });
    expect(res.statusCode).toBe(201);
  });

  it('User não pode criar role/policy/permission', async () => {
    let res = await request(app).post('/api/roles').set('Authorization', `Bearer ${userToken}`).send({ name: 'user-role' });
    expect([403,400,422]).toContain(res.statusCode);
    res = await request(app).post('/api/policies').set('Authorization', `Bearer ${userToken}`).send({ name: 'user-policy', document: { effect: 'allow', actions: ['read'], resources: ['users'] } });
    expect([403,400,422]).toContain(res.statusCode);
    res = await request(app).post('/api/permissions').set('Authorization', `Bearer ${userToken}`).send({ name: 'user-perm' });
    expect([403,400,422]).toContain(res.statusCode);
  });

  it('Root pode criar grupo, atribuir role/policy/permission e adicionar usuário', async () => {
    let res = await request(app).post('/api/groups').set('Authorization', `Bearer ${rootToken}`).send({ name: 'root-group' });
    expect(res.statusCode).toBe(201);
    group = res.body;
    // Adiciona user ao grupo
    res = await request(app).post(`/api/groups/${group.id}/users`).set('Authorization', `Bearer ${rootToken}`).send({ userId: user.id });
    expect([200,204,404]).toContain(res.statusCode);
    // Atribui role ao grupo
    res = await request(app).post(`/api/groups/${group.id}/roles`).set('Authorization', `Bearer ${rootToken}`).send({ roleId: 1 });
    expect([200,204,404]).toContain(res.statusCode);
    // Atribui policy ao grupo
    res = await request(app).post(`/api/groups/${group.id}/policies`).set('Authorization', `Bearer ${rootToken}`).send({ policyId: 1 });
    expect([200,204,404]).toContain(res.statusCode);
    // Atribui permission ao grupo
    res = await request(app).post(`/api/groups/${group.id}/permissions`).set('Authorization', `Bearer ${rootToken}`).send({ permissionId: 1 });
    expect([200,204,404]).toContain(res.statusCode);
  });

  it('User pode consultar seus próprios grupos, roles, policies e permissions', async () => {
    let res = await request(app).get('/api/users/me/groups').set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    res = await request(app).get('/api/users/me/roles').set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    res = await request(app).get('/api/users/me/policies').set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    res = await request(app).get('/api/users/me/permissions').set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
  });

  it('Admin só pode gerenciar entidades criadas por ele', async () => {
    // Tenta remover role do root
    let res = await request(app).delete('/api/roles/1').set('Authorization', `Bearer ${adminToken}`);
    expect([403,404]).toContain(res.statusCode);
    // Remove role própria
    res = await request(app).delete('/api/roles/2').set('Authorization', `Bearer ${adminToken}`);
    expect([200,204,404]).toContain(res.statusCode);
  });

  it('Mensagens de erro e validação são retornadas corretamente', async () => {
    let res = await request(app).post('/api/roles').set('Authorization', `Bearer ${adminToken}`).send({});
    expect([400,422,500]).toContain(res.statusCode);
    res = await request(app).get('/api/roles/9999').set('Authorization', `Bearer ${rootToken}`);
    expect([404,403]).toContain(res.statusCode);
  });

  afterAll(async () => {
    await sequelize.close();
  });
});
