const User = require('./User');
const Group = require('./Group');
const Role = require('./Role');
const Policy = require('./Policy');
const Permission = require('./Permission');
const sequelize = require('../config/sequelize');

// Relações básicas (pode ser expandido para user-groups, user-roles, etc)
User.belongsToMany(Group, { through: 'UserGroups' });
Group.belongsToMany(User, { through: 'UserGroups' });

User.belongsToMany(Role, { through: 'UserRoles' });
Role.belongsToMany(User, { through: 'UserRoles' });

Role.belongsToMany(Policy, { through: 'RolePolicies' });
Policy.belongsToMany(Role, { through: 'RolePolicies' });

// Relação Role <-> Permission (muitos para muitos)
Role.belongsToMany(Permission, { through: 'RolePermissions' });
Permission.belongsToMany(Role, { through: 'RolePermissions' });

Group.belongsToMany(Role, { through: 'GroupRoles' });
Role.belongsToMany(Group, { through: 'GroupRoles' });
Group.belongsToMany(Policy, { through: 'GroupPolicies' });
Policy.belongsToMany(Group, { through: 'GroupPolicies' });
Policy.belongsToMany(Permission, { through: 'PolicyPermissions' });
Permission.belongsToMany(Policy, { through: 'PolicyPermissions' });

module.exports = {
  User,
  Group,
  Role,
  Policy,
  Permission,
  sequelize
};
