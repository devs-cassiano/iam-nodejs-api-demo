const { Router } = require('express');
const RoleController = require('../controllers/RoleController');
const { authenticateJWT } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/policy');

const router = Router();

router.get('/', authenticateJWT, RoleController.list);
router.post('/', authenticateJWT, checkPermission('role:create', '*'), RoleController.create);
router.put('/:id', authenticateJWT, RoleController.update);
router.delete('/:id', authenticateJWT, RoleController.remove);
router.get('/:id', authenticateJWT, RoleController.get);
router.post('/:id/policies', authenticateJWT, checkPermission('role:attachPolicy', '*'), RoleController.addPolicy);

module.exports = router;
