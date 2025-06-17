const { Router } = require('express');
const { authenticateJWT } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/policy');
const PermissionController = require('../controllers/PermissionController');

const router = Router();

router.get('/', authenticateJWT, PermissionController.list);
router.get('/:id', authenticateJWT, PermissionController.get);
router.post('/', authenticateJWT, checkPermission('permission:create', '*'), PermissionController.create);
router.put('/:id', authenticateJWT, PermissionController.update);
router.delete('/:id', authenticateJWT, PermissionController.remove);

module.exports = router;
