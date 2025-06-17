const { Policy, Role, Permission } = require('../models');
function isRoot(user) { return user && Array.isArray(user.roles) && user.roles.includes('Root'); }
function isAdmin(user) { return user && Array.isArray(user.roles) && user.roles.includes('Admin'); }
function isUser(user) { return user && Array.isArray(user.roles) && user.roles.includes('User'); }

module.exports = {
  async list(req, res) {
    if (isRoot(req.user)) {
      const policies = await Policy.findAll({ include: [Role, require('../models').Permission] });
      return res.json(policies);
    }
    if (isAdmin(req.user)) {
      const policies = await Policy.findAll({ where: { createdBy: [req.user.id, null] }, include: [Role, require('../models').Permission] });
      return res.json(policies);
    }
    if (isUser(req.user)) {
      // User pode listar apenas suas policies via suas roles
      const roles = await req.user.getRoles({ include: ['Policies'] });
      const policies = [];
      for (const role of roles) {
        const pols = await role.getPolicies();
        policies.push(...pols);
      }
      // Remover duplicatas
      const unique = Array.from(new Map(policies.map(p => [p.id, p])).values());
      // Buscar permissions para cada policy
      const Permission = require('../models').Permission;
      const withPerms = await Promise.all(unique.map(async p => {
        const policy = await Policy.findByPk(p.id, { include: [Permission] });
        return { ...p.toJSON(), Permissions: policy.Permissions };
      }));
      return res.json(withPerms);
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async get(req, res) {
    const policy = await Policy.findByPk(req.params.id, { include: [Role, require('../models').Permission] });
    if (!policy) return res.status(404).json({ error: 'Not found' });
    if (isRoot(req.user) || (isAdmin(req.user) && (policy.createdBy === req.user.id || policy.createdBy === null))) {
      return res.json(policy);
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async create(req, res) {
    if (!isRoot(req.user) && !isAdmin(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (isAdmin(req.user)) {
      const exists = await Policy.findOne({ where: { name: req.body.name, createdBy: null } });
      if (exists) return res.status(400).json({ error: 'Policy name reserved by root' });
    }
    const data = { ...req.body, createdBy: isRoot(req.user) ? null : req.user.id };
    const policy = await Policy.create(data);
    res.status(201).json(policy);
  },
  async update(req, res) {
    const policy = await Policy.findByPk(req.params.id);
    if (!policy) return res.status(404).json({ error: 'Not found' });
    if (isRoot(req.user) || (isAdmin(req.user) && policy.createdBy === req.user.id)) {
      await policy.update(req.body);
      return res.json(policy);
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async remove(req, res) {
    const policy = await Policy.findByPk(req.params.id);
    if (!policy) return res.status(404).json({ error: 'Not found' });
    if (isRoot(req.user) || (isAdmin(req.user) && policy.createdBy === req.user.id)) {
      await policy.destroy();
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async attachRole(req, res) {
    const policy = await Policy.findByPk(req.params.id);
    const role = await Role.findByPk(req.body.roleId);
    if (!policy || !role) return res.status(404).json({ error: 'Not found' });
    // Admin só pode associar policies/roles criadas por ele ou pelo root
    if (isRoot(req.user) || (isAdmin(req.user) && [req.user.id, null].includes(policy.createdBy) && [req.user.id, null].includes(role.createdBy))) {
      await policy.addRole(role);
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async detachRole(req, res) {
    const policy = await Policy.findByPk(req.params.id);
    const role = await Role.findByPk(req.body.roleId);
    if (!policy || !role) return res.status(404).json({ error: 'Not found' });
    if (isRoot(req.user) || (isAdmin(req.user) && [req.user.id, null].includes(policy.createdBy) && [req.user.id, null].includes(role.createdBy))) {
      await policy.removeRole(role);
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async addPermission(req, res) {
    const policy = await Policy.findByPk(req.params.id);
    const permission = await Permission.findByPk(req.body.permissionId);
    if (!policy || !permission) return res.status(404).json({ error: 'Not found' });
    // Apenas verifica se o usuário tem permissão (middleware já faz isso)
    await policy.addPermission(permission);
    return res.status(204).end();
  },
  async removePermission(req, res) {
    const policy = await Policy.findByPk(req.params.id);
    const permission = await Permission.findByPk(req.body.permissionId);
    if (!policy || !permission) return res.status(404).json({ error: 'Not found' });
    if (isRoot(req.user) || (isAdmin(req.user) && [req.user.id, null].includes(policy.createdBy) && [req.user.id, null].includes(permission.createdBy))) {
      await policy.removePermission(permission);
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Access denied' });
  }
};
