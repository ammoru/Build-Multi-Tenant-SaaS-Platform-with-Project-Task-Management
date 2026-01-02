const pool = require('../config/db');

const logAudit = async ({
  tenantId,
  userId,
  action,
  entityType,
  entityId,
  ipAddress
}) => {
  await pool.query(
    `INSERT INTO audit_logs 
     (tenant_id, user_id, action, entity_type, entity_id, ip_address)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [tenantId, userId, action, entityType, entityId, ipAddress]
  );
};

module.exports = { logAudit };
