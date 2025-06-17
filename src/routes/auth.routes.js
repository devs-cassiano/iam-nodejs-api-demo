const { Router } = require('express');
const AuthController = require('../controllers/AuthController');
const { validateLogin } = require('../middlewares/validators');

const router = Router();

router.post('/login', validateLogin, AuthController.login);
router.post('/register', AuthController.register);

module.exports = router;
