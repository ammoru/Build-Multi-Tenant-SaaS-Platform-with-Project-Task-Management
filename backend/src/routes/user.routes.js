const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const controller = require('../controllers/user.controller');

// Update & delete users
router.put('/:userId', auth, controller.updateUser);
router.delete('/:userId', auth, controller.deleteUser);

module.exports = router;
