const { Permission, User, Role } = require('../models');
function isRoot(user) { return user && Array.isArray(user.roles) && user.roles.includes('Root'); }
function isAdmin(user) { return user && Array.isArray(user.roles) && user.roles.includes('Admin'); }
function isUser(user) { return user && Array.isArray(user.roles) && user.roles.includes('User'); }

module.exports = {
  async list(req, res) {
    if (isRoot(req.user)) {
      const permissions = await Permission.findAll();
      return res.json(permissions);
    }
    if (isAdmin(req.user)) {
      const permissions = await Permission.findAll({ where: { createdBy: [req.user.id, null] } });
      return res.json(permissions);
    }
    if (isUser(req.user)) {
      // User pode listar apenas suas permissions via suas roles
      const dbUser = await User.findByPk(req.user.id, { include: Role });
      let permissions = [];
      if (dbUser && dbUser.Roles) {
        for (const role of dbUser.Roles) {
          const dbRole = await Role.findByPk(role.id);
          if (dbRole && dbRole.getPermissions) {
            const perms = await dbRole.getPermissions();
            permissions.push(...perms);
          }
        }
      }
      // Remover duplicatas
      const unique = Array.from(new Map(permissions.map(p => [p.id, p])).values());
      return res.json(unique);
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async get(req, res) {
    const permission = await Permission.findByPk(req.params.id);
    if (!permission) return res.status(404).json({ error: 'Not found' });
    if (isRoot(req.user) || (isAdmin(req.user) && (permission.createdBy === req.user.id || permission.createdBy === null))) {
      return res.json(permission);
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async create(req, res) {
    if (!isRoot(req.user) && !isAdmin(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (isAdmin(req.user)) {
      const exists = await Permission.findOne({ where: { name: req.body.name, createdBy: null } });
      if (exists) return res.status(400).json({ error: 'Permission name reserved by root' });
    }
    const data = { ...req.body, createdBy: isRoot(req.user) ? null : req.user.id };
    const permission = await Permission.create(data);
    res.status(201).json(permission);
  },
  async update(req, res) {
    const permission = await Permission.findByPk(req.params.id);
    if (!permission) return res.status(404).json({ error: 'Not found' });
    if (isRoot(req.user) || (isAdmin(req.user) && permission.createdBy === req.user.id)) {
      await permission.update(req.body);
      return res.json(permission);
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async remove(req, res) {
    const permission = await Permission.findByPk(req.params.id);
    if (!permission) return res.status(404).json({ error: 'Not found' });
    if (isRoot(req.user) || (isAdmin(req.user) && permission.createdBy === req.user.id)) {
      await permission.destroy();
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Access denied' });
  }
};
