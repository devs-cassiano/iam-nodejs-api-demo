const { Router } = require('express');
const GroupController = require('../controllers/GroupController');
const { authenticateJWT } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/policy');

const router = Router();

router.get('/', authenticateJWT, GroupController.list);
router.post('/', authenticateJWT, checkPermission('group:create', '*'), GroupController.create);
router.put('/:id', authenticateJWT, GroupController.update);
router.delete('/:id', authenticateJWT, GroupController.remove);
router.get('/:id', authenticateJWT, GroupController.get);

// Gerenciamento de usuários no grupo
router.post('/:id/users', authenticateJWT, checkPermission('groups:addUser', '*'), GroupController.addUser);
router.delete('/:id/users/:userId', authenticateJWT, GroupController.removeUser);
router.get('/:id/users', authenticateJWT, GroupController.listUsers);

// Gerenciamento de roles no grupo
router.post('/:id/roles', authenticateJWT, GroupController.addRole);
router.delete('/:id/roles/:roleId', authenticateJWT, GroupController.removeRole);
router.get('/:id/roles', authenticateJWT, GroupController.listRoles);

// Gerenciamento de policies no grupo
router.post('/:id/policies', authenticateJWT, GroupController.addPolicy);
router.delete('/:id/policies/:policyId', authenticateJWT, GroupController.removePolicy);
router.get('/:id/policies', authenticateJWT, GroupController.listPolicies);

module.exports = router;
