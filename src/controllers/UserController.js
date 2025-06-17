const { User, Group, Role, Policy, Permission } = require('../models');

function isRoot(user) { return user && Array.isArray(user.roles) && user.roles.includes('Root'); }
function isAdmin(user) { return user && Array.isArray(user.roles) && user.roles.includes('Admin'); }
function isUser(user) { return user && Array.isArray(user.roles) && user.roles.includes('User'); }

module.exports = {
  async list(req, res) {
    if (isRoot(req.user)) {
      const users = await User.findAll();
      return res.json(users);
    }
    if (isAdmin(req.user)) {
      const users = await User.findAll({ where: { createdBy: req.user.id } });
      return res.json(users);
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async get(req, res) {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    if (
      isRoot(req.user) ||
      (isAdmin(req.user) && user.createdBy === req.user.id) ||
      (isUser(req.user) && req.user.id === user.id)
    ) {
      return res.json(user);
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async create(req, res) {
    if (!isRoot(req.user) && !isAdmin(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const data = { ...req.body, createdBy: req.user.id };
    const user = await User.create(data);
    res.status(201).json(user);
  },
  async update(req, res) {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    if (isRoot(req.user) || (isAdmin(req.user) && user.createdBy === req.user.id)) {
      await user.update(req.body);
      return res.json(user);
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async remove(req, res) {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    if (isRoot(req.user) || (isAdmin(req.user) && user.createdBy === req.user.id)) {
      await user.destroy();
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async addRole(req, res) {
    const user = await User.findByPk(req.params.id);
    const role = await Role.findByPk(req.body.roleId);
    if (!user || !role) return res.status(404).json({ error: 'Not found' });
    if (
      isRoot(req.user) ||
      (isAdmin(req.user) && user.createdBy === req.user.id && [req.user.id, null].includes(role.createdBy))
    ) {
      await user.addRole(role);
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async removeRole(req, res) {
    const user = await User.findByPk(req.params.id);
    const role = await Role.findByPk(req.params.roleId);
    if (!user || !role) return res.status(404).json({ error: 'Not found' });
    if (
      isRoot(req.user) ||
      (isAdmin(req.user) && user.createdBy === req.user.id && [req.user.id, null].includes(role.createdBy))
    ) {
      await user.removeRole(role);
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async addPermission(req, res) {
    const user = await User.findByPk(req.params.id);
    const permission = await Permission.findByPk(req.body.permissionId);
    if (!user || !permission) return res.status(404).json({ error: 'Not found' });
    if (
      isRoot(req.user) ||
      (isAdmin(req.user) && user.createdBy === req.user.id && [req.user.id, null].includes(permission.createdBy))
    ) {
      await user.addPermission(permission);
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async removePermission(req, res) {
    const user = await User.findByPk(req.params.id);
    const permission = await Permission.findByPk(req.params.permissionId);
    if (!user || !permission) return res.status(404).json({ error: 'Not found' });
    if (
      isRoot(req.user) ||
      (isAdmin(req.user) && user.createdBy === req.user.id && [req.user.id, null].includes(permission.createdBy))
    ) {
      await user.removePermission(permission);
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async addPolicy(req, res) {
    const user = await User.findByPk(req.params.id);
    const policy = await Policy.findByPk(req.body.policyId);
    if (!user || !policy) return res.status(404).json({ error: 'Not found' });
    if (
      isRoot(req.user) ||
      (isAdmin(req.user) && user.createdBy === req.user.id && [req.user.id, null].includes(policy.createdBy))
    ) {
      await user.addPolicy(policy);
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async removePolicy(req, res) {
    const user = await User.findByPk(req.params.id);
    const policy = await Policy.findByPk(req.params.policyId);
    if (!user || !policy) return res.status(404).json({ error: 'Not found' });
    if (
      isRoot(req.user) ||
      (isAdmin(req.user) && user.createdBy === req.user.id && [req.user.id, null].includes(policy.createdBy))
    ) {
      await user.removePolicy(policy);
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async myGroups(req, res) {
    // Permite root, admin e user verem seus grupos
    const user = await User.findByPk(req.user.id);
    const groups = await user.getGroups();
    return res.json(groups);
  },
  async myRoles(req, res) {
    // Permite root, admin e user verem suas roles
    const user = await User.findByPk(req.user.id);
    const roles = await user.getRoles();
    return res.json(roles);
  },
  async myPermissions(req, res) {
    // Permite root, admin e user verem suas permissions
    const user = await User.findByPk(req.user.id);
    const roles = await user.getRoles();
    let permissions = [];
    for (const role of roles) {
      const perms = await role.getPermissions();
      permissions.push(...perms);
    }
    // Remover duplicatas
    const unique = Array.from(new Map(permissions.map(p => [p.id, p])).values());
    return res.json(unique);
  },
  async myPolicies(req, res) {
    // Permite root, admin e user verem suas policies
    const user = await User.findByPk(req.user.id);
    const roles = await user.getRoles();
    let policies = [];
    for (const role of roles) {
      const pols = await role.getPolicies();
      policies.push(...pols);
    }
    // Remover duplicatas
    const unique = Array.from(new Map(policies.map(p => [p.id, p])).values());
    return res.json(unique);
  }
};
