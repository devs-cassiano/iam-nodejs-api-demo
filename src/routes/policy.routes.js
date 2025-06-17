const { Router } = require('express');
const PolicyController = require('../controllers/PolicyController');
const { authenticateJWT } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/policy');

const router = Router();

router.get('/', authenticateJWT, PolicyController.list);
router.post('/', authenticateJWT, checkPermission('policy:create', '*'), PolicyController.create);
router.put('/:id', authenticateJWT, PolicyController.update);
router.delete('/:id', authenticateJWT, PolicyController.remove);
router.get('/:id', authenticateJWT, PolicyController.get);
router.post('/:id/permissions', authenticateJWT, checkPermission('policy:attachPermission', '*'), PolicyController.addPermission);

module.exports = router;
