const { Router } = require('express');
const UserController = require('../controllers/UserController');
const { authenticateJWT } = require('../middlewares/auth');

const router = Router();

router.get('/', authenticateJWT, UserController.list);
router.get('/:id', authenticateJWT, UserController.get);
router.post('/', authenticateJWT, UserController.create);
router.put('/:id', authenticateJWT, UserController.update);
router.delete('/:id', authenticateJWT, UserController.remove);

// Atribuição de roles, permissions e policies a usuários
router.post('/:id/roles', authenticateJWT, UserController.addRole);
router.delete('/:id/roles/:roleId', authenticateJWT, UserController.removeRole);
router.post('/:id/permissions', authenticateJWT, UserController.addPermission);
router.delete('/:id/permissions/:permissionId', authenticateJWT, UserController.removePermission);
router.post('/:id/policies', authenticateJWT, UserController.addPolicy);
router.delete('/:id/policies/:policyId', authenticateJWT, UserController.removePolicy);

// Consultar grupos, roles, permissions e policies do próprio usuário
router.get('/me/groups', authenticateJWT, UserController.myGroups);
router.get('/me/roles', authenticateJWT, UserController.myRoles);
router.get('/me/permissions', authenticateJWT, UserController.myPermissions);
router.get('/me/policies', authenticateJWT, UserController.myPolicies);

module.exports = router;
