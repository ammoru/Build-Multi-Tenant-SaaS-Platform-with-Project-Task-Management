const { body } = require('express-validator');

exports.registerTenant = [
  body('tenantName').notEmpty(),
  body('subdomain')
    .matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/)
    .withMessage('Invalid subdomain'),
  body('adminEmail').isEmail(),
  body('adminPassword').isLength({ min: 8 }),
  body('adminFullName').notEmpty()
];
exports.loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  // ✅ OPTIONAL – required only for tenant users (checked in controller)
  body('tenantSubdomain')
    .optional()
    .isString()
    .withMessage('Invalid tenant subdomain')
];
