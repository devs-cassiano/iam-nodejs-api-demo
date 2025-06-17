const { Group, User, Role, Policy } = require('../models');
function isRoot(user) { return user && Array.isArray(user.roles) && user.roles.includes('Root'); }
function isAdmin(user) { return user && Array.isArray(user.roles) && user.roles.includes('Admin'); }
function isUser(user) { return user && Array.isArray(user.roles) && user.roles.includes('User'); }

module.exports = {
  async list(req, res) {
    if (isRoot(req.user)) {
      const groups = await Group.findAll({ include: User });
      return res.json(groups);
    }
    if (isAdmin(req.user)) {
      const groups = await Group.findAll({ where: { createdBy: [req.user.id, null] }, include: User });
      return res.json(groups);
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async get(req, res) {
    const group = await require('../models').Group.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Not found' });
    return res.json(group);
  },
  async create(req, res) {
    if (!isRoot(req.user) && !isAdmin(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (isAdmin(req.user)) {
      const exists = await Group.findOne({ where: { name: req.body.name, createdBy: null } });
      if (exists) return res.status(400).json({ error: 'Group name reserved by root' });
    }
    const data = { ...req.body, createdBy: isRoot(req.user) ? null : req.user.id };
    const group = await Group.create(data);
    res.status(201).json(group);
  },
  async update(req, res) {
    const group = await Group.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Not found' });
    if (isRoot(req.user) || (isAdmin(req.user) && group.createdBy === req.user.id)) {
      await group.update(req.body);
      return res.json(group);
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async remove(req, res) {
    const group = await Group.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Not found' });
    if (isRoot(req.user) || (isAdmin(req.user) && group.createdBy === req.user.id)) {
      await group.destroy();
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async addUser(req, res) {
    const group = await Group.findByPk(req.params.id);
    const user = await User.findByPk(req.body.userId);
    if (!group || !user) return res.status(404).json({ error: 'Not found' });
    await group.addUser(user);
    return res.status(204).end();
  },
  async removeUser(req, res) {
    const group = await Group.findByPk(req.params.id);
    const user = await User.findByPk(req.params.userId);
    if (!group || !user) return res.status(404).json({ error: 'Not found' });
    if (
      isRoot(req.user) ||
      (isAdmin(req.user) && (group.createdBy === req.user.id || group.createdBy === null) && user.createdBy === req.user.id)
    ) {
      await group.removeUser(user);
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async listUsers(req, res) {
    const group = await Group.findByPk(req.params.id, { include: User });
    if (!group) return res.status(404).json({ error: 'Not found' });
    if (
      isRoot(req.user) ||
      (isAdmin(req.user) && (group.createdBy === req.user.id || group.createdBy === null))
    ) {
      return res.json(group.Users);
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async addRole(req, res) {
    const group = await Group.findByPk(req.params.id);
    const role = await Role.findByPk(req.body.roleId);
    if (!group || !role) return res.status(404).json({ error: 'Not found' });
    if (
      isRoot(req.user) ||
      (isAdmin(req.user) && (group.createdBy === req.user.id || group.createdBy === null) && [req.user.id, null].includes(role.createdBy))
    ) {
      await group.addRole(role);
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async removeRole(req, res) {
    const group = await Group.findByPk(req.params.id);
    const role = await Role.findByPk(req.params.roleId);
    if (!group || !role) return res.status(404).json({ error: 'Not found' });
    if (
      isRoot(req.user) ||
      (isAdmin(req.user) && (group.createdBy === req.user.id || group.createdBy === null) && [req.user.id, null].includes(role.createdBy))
    ) {
      await group.removeRole(role);
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async listRoles(req, res) {
    const group = await Group.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Not found' });
    if (
      isRoot(req.user) ||
      (isAdmin(req.user) && (group.createdBy === req.user.id || group.createdBy === null))
    ) {
      const roles = await group.getRoles();
      return res.json(roles);
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async addPolicy(req, res) {
    const group = await Group.findByPk(req.params.id);
    const policy = await Policy.findByPk(req.body.policyId);
    if (!group || !policy) return res.status(404).json({ error: 'Not found' });
    if (
      isRoot(req.user) ||
      (isAdmin(req.user) && (group.createdBy === req.user.id || group.createdBy === null) && [req.user.id, null].includes(policy.createdBy))
    ) {
      await group.addPolicy(policy);
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async removePolicy(req, res) {
    const group = await Group.findByPk(req.params.id);
    const policy = await Policy.findByPk(req.params.policyId);
    if (!group || !policy) return res.status(404).json({ error: 'Not found' });
    if (
      isRoot(req.user) ||
      (isAdmin(req.user) && (group.createdBy === req.user.id || group.createdBy === null) && [req.user.id, null].includes(policy.createdBy))
    ) {
      await group.removePolicy(policy);
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async listPolicies(req, res) {
    const group = await Group.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Not found' });
    if (
      isRoot(req.user) ||
      (isAdmin(req.user) && (group.createdBy === req.user.id || group.createdBy === null))
    ) {
      const policies = await group.getPolicies();
      return res.json(policies);
    }
    return res.status(403).json({ error: 'Access denied' });
  }
};
