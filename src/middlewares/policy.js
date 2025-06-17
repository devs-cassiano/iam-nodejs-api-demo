// Middleware para checagem de permissão baseada em policies IAM
const { User, Role, Policy } = require('../models');

function matchIamValue(value, target) {
  if (value === '*' || target === '*') return true;
  if (Array.isArray(value)) return value.includes(target) || value.includes('*');
  if (Array.isArray(target)) return target.includes(value) || target.includes('*');
  return value === target;
}

function checkPermission(action, resource) {
  return async function (req, res, next) {
    // Permite action/resource como função dinâmica
    const resolvedAction = typeof action === 'function' ? action(req) : action;
    const resolvedResource = typeof resource === 'function' ? resource(req) : resource;
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.user.id;
    const user = await User.findByPk(userId, { include: Role });
    if (!user) return res.status(403).json({ error: 'User not found' });
    const userRoles = user.Roles || [];
    // Para cada role do usuário, busque as policies
    for (const role of userRoles) {
      const roleWithPolicies = await Role.findByPk(role.id, { include: Policy });
      for (const policy of roleWithPolicies.Policies || roleWithPolicies.policies || []) {
        // Policy.document deve ser um array de statements IAM
        for (const statement of policy.document.Statement || []) {
          if (
            statement.Effect === 'Allow' &&
            matchIamValue(statement.Action, resolvedAction) &&
            matchIamValue(statement.Resource, resolvedResource)
          ) {
            return next();
          }
        }
      }
    }
    return res.status(403).json({ error: 'Access denied' });
  };
}

module.exports = { checkPermission };
