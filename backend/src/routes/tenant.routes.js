const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const tenantCtrl = require('../controllers/tenant.controller');

router.get('/:tenantId', auth, tenantCtrl.getTenantDetails);
router.put('/:tenantId', auth, tenantCtrl.updateTenant);
router.get('/', auth, tenantCtrl.listTenants);



const userController = require('../controllers/user.controller');

router.get('/:tenantId/users', auth, userController.listUsers);
router.post('/:tenantId/users', auth, userController.addUser);


module.exports = router;
