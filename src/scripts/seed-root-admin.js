const bcrypt = require('bcryptjs');
const { User, Role, Policy, Permission } = require('../models');
const sequelize = require('../config/sequelize');

async function seedRootAndAdmin() {
  await sequelize.sync();

  // Cria role Root se não existir
  const [rootRole] = await Role.findOrCreate({ where: { name: 'Root' }, defaults: { createdBy: null } });
  // Cria role Admin se não existir
  const [adminRole] = await Role.findOrCreate({ where: { name: 'Admin' }, defaults: { createdBy: null } });

  // Cria usuário root se não existir
  let rootUser = await User.findOne({ where: { email: process.env.ROOT_EMAIL || 'root@system.local' } });
  if (!rootUser) {
    const passwordHash = await bcrypt.hash(process.env.ROOT_PASSWORD || 'rootpassword', 10);
    rootUser = await User.create({
      email: process.env.ROOT_EMAIL || 'root@system.local',
      password: passwordHash,
      createdBy: null
    });
    await rootUser.addRole(rootRole);
    console.log(`Usuário root criado! Email: ${rootUser.email} | Senha: ${process.env.ROOT_PASSWORD || 'rootpassword'}`);
  } else {
    // Garante que o root tenha a role Root
    const roles = await rootUser.getRoles();
    if (!roles.map(r => r.name).includes('Root')) {
      await rootUser.addRole(rootRole);
      console.log('Role Root associada ao usuário root existente.');
    }
    console.log(`Usuário root já existe. Email: ${rootUser.email}`);
  }

  // Cria usuário admin se não existir
  let adminUser = await User.findOne({ where: { email: process.env.ADMIN_EMAIL || 'admin@system.local' } });
  if (!adminUser) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'adminpassword', 10);
    adminUser = await User.create({
      email: process.env.ADMIN_EMAIL || 'admin@system.local',
      password: passwordHash,
      createdBy: rootUser.id
    });
    await adminUser.addRole(adminRole);
    console.log(`Usuário admin criado! Email: ${adminUser.email} | Senha: ${process.env.ADMIN_PASSWORD || 'adminpassword'}`);
  } else {
    // Garante que o admin tenha a role Admin
    const roles = await adminUser.getRoles();
    if (!roles.map(r => r.name).includes('Admin')) {
      await adminUser.addRole(adminRole);
      console.log('Role Admin associada ao usuário admin existente.');
    }
    console.log(`Usuário admin já existe. Email: ${adminUser.email}`);
  }

  // Remove todas as roles do root e associa apenas Root
  await rootUser.setRoles([rootRole]);
  // Remove todas as roles do admin e associa apenas Admin
  await adminUser.setRoles([adminRole]);

  // Remove explicitamente a role 'User' de root/admin, se existir
  const userRole = await Role.findOne({ where: { name: 'User' } });
  if (userRole) {
    await rootUser.removeRole(userRole);
    await adminUser.removeRole(userRole);
  }

  // Cria todas as permissions globais do sistema (CRUD para cada recurso principal)
  const allPermissions = [
    'user:create', 'user:read', 'user:update', 'user:delete',
    'role:create', 'role:read', 'role:update', 'role:delete',
    'policy:create', 'policy:read', 'policy:update', 'policy:delete',
    'permission:create', 'permission:read', 'permission:update', 'permission:delete',
    'group:create', 'group:read', 'group:update', 'group:delete',
    'groups:addUser'
  ];
  let permissionRecords = [];
  for (const permName of allPermissions) {
    const [perm] = await Permission.findOrCreate({
      where: { name: permName },
      defaults: { description: `Permissão para ${permName}`, createdBy: null }
    });
    permissionRecords.push(perm);
  }

  // Cria policy root se não existir
  const [rootPolicy] = await Policy.findOrCreate({
    where: { name: 'RootFullAccess' },
    defaults: {
      document: {
        Version: '2025-06-17',
        Statement: [
          { Effect: 'Allow', Action: '*', Resource: '*' },
          { Effect: 'Allow', Action: 'groups:addUser', Resource: '*' }
        ]
      },
      createdBy: null
    }
  });

  // Associa todas as permissions à policy root
  await rootPolicy.setPermissions(permissionRecords);
  // Associa policy root à role Root
  await rootRole.addPolicy(rootPolicy);
  // Reforça associação da policy root à role Root
  await rootRole.setPolicies([rootPolicy]);

  process.exit();
}

seedRootAndAdmin().catch(err => {
  console.error('Erro ao criar usuários root/admin:', err);
  process.exit(1);
});
