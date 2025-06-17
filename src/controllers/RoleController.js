const { Role, Policy } = require('../models');
function isRoot(user) { return user && Array.isArray(user.roles) && user.roles.includes('Root'); }
function isAdmin(user) { return user && Array.isArray(user.roles) && user.roles.includes('Admin'); }
function isUser(user) { return user && Array.isArray(user.roles) && user.roles.includes('User'); }

module.exports = {
  async list(req, res) {
    if (isRoot(req.user)) {
      const roles = await Role.findAll();
      return res.json(roles);
    }
    if (isAdmin(req.user)) {
      // Admin pode listar roles criadas por ele ou pelo root
      const roles = await Role.findAll({ where: { createdBy: [req.user.id, null] } });
      return res.json(roles);
    }
    if (isUser(req.user)) {
      // User pode listar apenas suas próprias roles
      const userRoles = await req.user.getRoles();
      return res.json(userRoles);
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async create(req, res) {
    if (!isRoot(req.user) && !isAdmin(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!req.body.name) {
      return res.status(400).json({ error: 'Role name is required' });
    }
    // Admin não pode criar role com nome já existente do root
    if (isAdmin(req.user)) {
      const exists = await Role.findOne({ where: { name: req.body.name, createdBy: null } });
      if (exists) return res.status(400).json({ error: 'Role name reserved by root' });
    }
    const data = { ...req.body, createdBy: isRoot(req.user) ? null : req.user.id };
    const role = await Role.create(data);
    res.status(201).json(role);
  },
  async update(req, res) {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ error: 'Not found' });
    if (isRoot(req.user) || (isAdmin(req.user) && role.createdBy === req.user.id)) {
      await role.update(req.body);
      return res.json(role);
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async remove(req, res) {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ error: 'Not found' });
    if (isRoot(req.user) || (isAdmin(req.user) && role.createdBy === req.user.id)) {
      await role.destroy();
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async get(req, res) {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ error: 'Not found' });
    return res.json(role);
  },
  async addPolicy(req, res) {
    const role = await Role.findByPk(req.params.id);
    const policy = await Policy.findByPk(req.body.policyId);
    if (!role || !policy) return res.status(404).json({ error: 'Not found' });
    // Apenas verifica se o usuário tem permissão (middleware já faz isso)
    await role.addPolicy(policy);
    return res.status(204).end();
  }
};
