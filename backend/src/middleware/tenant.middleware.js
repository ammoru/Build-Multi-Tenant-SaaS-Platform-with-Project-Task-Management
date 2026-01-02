module.exports = (req, res, next) => {
  if (req.user.role === 'super_admin') {
    return next(); // super admin bypass
  }

  const tenantId =
    req.params.tenantId ||
    req.body.tenantId ||
    req.query.tenantId;

  if (tenantId && tenantId !== req.user.tenantId) {
    return res.status(403).json({
      success: false,
      message: 'Cross-tenant access denied'
    });
  }

  next();
};
