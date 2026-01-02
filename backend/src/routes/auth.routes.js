const router = require('express').Router();
const controller = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const auth = require('../middleware/auth.middleware');
const { registerTenant, login, loginValidator } = require('../validators/auth.validator');

router.post('/register-tenant', registerTenant, validate, controller.registerTenant);
router.post('/login', loginValidator, validate, controller.login);
router.get('/me', auth, controller.me);
router.post('/logout', auth, controller.logout);

module.exports = router;
