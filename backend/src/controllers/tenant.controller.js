const pool = require('../config/db');
const { success } = require('../utils/response');

exports.getTenantDetails = async (req, res, next) => {
  try {
    const { tenantId } = req.params;

    // Authorization
    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    const tenantRes = await pool.query(
      `SELECT id, name, subdomain, status, subscription_plan,
              max_users, max_projects, created_at
       FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (tenantRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const statsRes = await pool.query(
      `
      SELECT
        (SELECT COUNT(*) FROM users WHERE tenant_id = $1) AS total_users,
        (SELECT COUNT(*) FROM projects WHERE tenant_id = $1) AS total_projects,
        (SELECT COUNT(*) FROM tasks WHERE tenant_id = $1) AS total_tasks
      `,
      [tenantId]
    );

    const t = tenantRes.rows[0];
    const s = statsRes.rows[0];

    return success(res, {
      id: t.id,
      name: t.name,
      subdomain: t.subdomain,
      status: t.status,
      subscriptionPlan: t.subscription_plan,
      maxUsers: t.max_users,
      maxProjects: t.max_projects,
      createdAt: t.created_at,
      stats: {
        totalUsers: Number(s.total_users),
        totalProjects: Number(s.total_projects),
        totalTasks: Number(s.total_tasks)
      }
    });
  } catch (err) {
    next(err);
  }
};


const { logAudit } = require('../services/audit.service');

exports.updateTenant = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;

    const isSuperAdmin = req.user.role === 'super_admin';

    if (!isSuperAdmin && req.user.tenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (!isSuperAdmin && (status || subscriptionPlan || maxUsers || maxProjects)) {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can update these fields'
      });
    }

    const updates = [];
    const values = [];
    let idx = 1;

    if (name) { updates.push(`name = $${idx++}`); values.push(name); }
    if (isSuperAdmin && status) { updates.push(`status = $${idx++}`); values.push(status); }
    if (isSuperAdmin && subscriptionPlan) {
      updates.push(`subscription_plan = $${idx++}`); values.push(subscriptionPlan);
    }
    if (isSuperAdmin && maxUsers) { updates.push(`max_users = $${idx++}`); values.push(maxUsers); }
    if (isSuperAdmin && maxProjects) {
      updates.push(`max_projects = $${idx++}`); values.push(maxProjects);
    }

    const result = await pool.query(
      `UPDATE tenants SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${idx}
       RETURNING id, name, updated_at`,
      [...values, tenantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    await logAudit({
      tenantId,
      userId: req.user.id,
      action: 'UPDATE_TENANT',
      entityType: 'tenant',
      entityId: tenantId,
      ipAddress: req.ip
    });

    return success(res, result.rows[0], 'Tenant updated successfully');
  } catch (err) {
    next(err);
  }
};


exports.listTenants = async (req, res, next) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const page = Number(req.query.page || 1);
    const limit = Math.min(Number(req.query.limit || 10), 100);
    const offset = (page - 1) * limit;

    const { status, subscriptionPlan } = req.query;

    const filters = [];
    const values = [];
    let idx = 1;

    if (status) { filters.push(`t.status = $${idx++}`); values.push(status); }
    if (subscriptionPlan) {
      filters.push(`t.subscription_plan = $${idx++}`);
      values.push(subscriptionPlan);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const dataRes = await pool.query(
      `
      SELECT t.id, t.name, t.subdomain, t.status, t.subscription_plan, t.created_at,
        (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) AS total_users,
        (SELECT COUNT(*) FROM projects p WHERE p.tenant_id = t.id) AS total_projects
      FROM tenants t
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
      `,
      [...values, limit, offset]
    );

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM tenants t ${whereClause}`,
      values
    );

    return success(res, {
      tenants: dataRes.rows.map(t => ({
        id: t.id,
        name: t.name,
        subdomain: t.subdomain,
        status: t.status,
        subscriptionPlan: t.subscription_plan,
        totalUsers: Number(t.total_users),
        totalProjects: Number(t.total_projects),
        createdAt: t.created_at
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(countRes.rows[0].count / limit),
        totalTenants: Number(countRes.rows[0].count),
        limit
      }
    });
  } catch (err) {
    next(err);
  }
};
