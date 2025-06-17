const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/groups', require('./group.routes'));
router.use('/roles', require('./role.routes'));
router.use('/policies', require('./policy.routes'));
router.use('/permissions', require('./permission.routes'));

// Rotas protegidas por autenticação e policy IAM (secure resource)
const { authenticateJWT } = require('../middlewares/auth');
const { checkPermission } = require('../middlewares/policy');

router.get('/secure/resource', authenticateJWT, checkPermission('read:secure-resource', 'arn:myapi:resource:secure'), (req, res) => {
  res.json({ message: 'Acesso permitido ao recurso seguro!' });
});

router.post('/secure/resource', authenticateJWT, checkPermission('write:secure-resource', 'arn:myapi:resource:secure'), (req, res) => {
  res.json({ message: 'Ação de escrita permitida no recurso seguro!' });
});

module.exports = router;
