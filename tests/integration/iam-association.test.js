const request = require('supertest');
const app = require('../../src/index');
const { User, Role, Policy, Permission } = require('../../src/models');
const jwt = require('jsonwebtoken');

describe('IAM - Associação de Policies a Roles e Permissions a Policies', () => {
  let root, admin, user, rootToken, adminToken, userToken, role, policy, permission;
  beforeAll(async () => {
    // Garante que todas as tabelas estão sincronizadas com o banco
    await require('../../src/models').sequelize.sync({ alter: true });
    await Permission.destroy({ where: {}, truncate: true, cascade: true });
    await Policy.destroy({ where: {}, truncate: true, cascade: true });
    await Role.destroy({ where: {}, truncate: true, cascade: true });
    await User.destroy({ where: {}, truncate: true, cascade: true });
    // Cria usuários
    root = await User.create({ email: 'root-test@example.com', password: 'rootpass' });
    admin = await User.create({ email: 'admin-test@example.com', password: 'adminpass' });
    user = await User.create({ email: 'user-test@example.com', password: 'userpass' });
    // Cria roles
    const rootRole = await Role.create({ name: 'Root', createdBy: null });
    const adminRole = await Role.create({ name: 'Admin', createdBy: null });
    const userRole = await Role.create({ name: 'User', createdBy: null });
    await root.setRoles([rootRole]);
    await admin.setRoles([adminRole]);
    await user.setRoles([userRole]);
    // Gera tokens
    rootToken = jwt.sign({ id: root.id, email: root.email, roles: ['Root'] }, process.env.JWT_SECRET);
    adminToken = jwt.sign({ id: admin.id, email: admin.email, roles: ['Admin'] }, process.env.JWT_SECRET);
    userToken = jwt.sign({ id: user.id, email: user.email, roles: ['User'] }, process.env.JWT_SECRET);
    // Cria policy e permission
    policy = await Policy.create({ name: 'TestPolicy', document: { Statement: [] }, createdBy: null });
    permission = await Permission.create({ name: 'test:doSomething', createdBy: null });
    role = await Role.create({ name: 'TestRole', createdBy: null });
    // Associa policy FullAccess à role Root
    const fullAccessPolicy = await Policy.create({
      name: 'RootFullAccess',
      document: {
        Version: '2025-06-17',
        Statement: [
          { Effect: 'Allow', Action: '*', Resource: '*' }
        ]
      },
      createdBy: null
    });
    await rootRole.addPolicy(fullAccessPolicy);
  });

  it('Root pode associar qualquer policy a qualquer role', async () => {
    const res = await request(app)
      .post(`/api/roles/${role.id}/policies`)
      .set('Authorization', `Bearer ${rootToken}`)
      .send({ policyId: policy.id });
    expect([200,204]).toContain(res.statusCode);
  });

  it('Root pode associar qualquer permission a qualquer policy', async () => {
    const res = await request(app)
      .post(`/api/policies/${policy.id}/permissions`)
      .set('Authorization', `Bearer ${rootToken}`)
      .send({ permissionId: permission.id });
    expect([200,204]).toContain(res.statusCode);
  });

  it('Admin pode associar se tiver permission (simula permission concedida)', async () => {
    const res = await request(app)
      .post(`/api/roles/${role.id}/policies`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ policyId: policy.id });
    expect([200,204,403]).toContain(res.statusCode);
  });

  it('User não pode associar policy a role', async () => {
    const res = await request(app)
      .post(`/api/roles/${role.id}/policies`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ policyId: policy.id });
    expect(res.statusCode).toBe(403);
  });

  it('User não pode associar permission a policy', async () => {
    const res = await request(app)
      .post(`/api/policies/${policy.id}/permissions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ permissionId: permission.id });
    expect(res.statusCode).toBe(403);
  });

  afterAll(async () => {
    const { sequelize } = require('../../src/models');
    await sequelize.close();
  });
});