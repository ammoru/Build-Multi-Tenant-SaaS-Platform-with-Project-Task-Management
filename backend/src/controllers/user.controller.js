const bcrypt = require('bcrypt');
const { logAudit } = require('../services/audit.service');
const pool = require('../config/db');

const { success } = require('../utils/response');




exports.addUser = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { email, password, fullName, role = 'user' } = req.body;

    if (req.user.role !== 'tenant_admin' || req.user.tenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const tenantRes = await pool.query(
      'SELECT max_users FROM tenants WHERE id = $1',
      [tenantId]
    );

    const countRes = await pool.query(
      'SELECT COUNT(*) FROM users WHERE tenant_id = $1',
      [tenantId]
    );

    if (Number(countRes.rows[0].count) >= tenantRes.rows[0].max_users) {
      return res.status(403).json({ success: false, message: 'Subscription limit reached' });
    }

    const hash = await bcrypt.hash(password, 10);

    const userRes = await pool.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, email, full_name, role, is_active, created_at`,
      [tenantId, email, hash, fullName, role]
    );

    await logAudit({
      tenantId,
      userId: req.user.id,
      action: 'CREATE_USER',
      entityType: 'user',
      entityId: userRes.rows[0].id,
      ipAddress: req.ip
    });

    return success(res, {
      ...userRes.rows[0],
      tenantId
    }, 'User created successfully', 201);

  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    next(err);
  }
};


/* =================================================
   API 9: LIST TENANT USERS
   GET /api/tenants/:tenantId/users
================================================= */
exports.listUsers = async (req, res, next) => {
  try {
    const { tenantId } = req.params;

    // Authorization: must belong to tenant or super_admin
    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const page = Number(req.query.page || 1);
    const limit = Math.min(Number(req.query.limit || 50), 100);
    const offset = (page - 1) * limit;

    const { search, role } = req.query;

    const filters = ['tenant_id = $1'];
    const values = [tenantId];
    let idx = 2;

    if (search) {
      filters.push(`(email ILIKE $${idx} OR full_name ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    if (role) {
      filters.push(`role = $${idx}`);
      values.push(role);
      idx++;
    }

    const whereClause = filters.join(' AND ');

    const usersRes = await pool.query(
      `
      SELECT id, email, full_name, role, is_active, created_at
      FROM users
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
      `,
      [...values, limit, offset]
    );

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM users WHERE ${whereClause}`,
      values
    );

    return success(res, {
      users: usersRes.rows.map(u => ({
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        role: u.role,
        isActive: u.is_active,
        createdAt: u.created_at
      })),
      total: Number(countRes.rows[0].count),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(countRes.rows[0].count / limit),
        limit
      }
    });
  } catch (err) {
    next(err);
  }
};

/* =================================================
   API 10: UPDATE USER
   PUT /api/users/:userId
================================================= */
exports.updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { fullName, role, isActive } = req.body;

    const userRes = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const targetUser = userRes.rows[0];

    // Same tenant check
    if (
      req.user.role !== 'super_admin' &&
      targetUser.tenant_id !== req.user.tenantId
    ) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Self update restriction
    if (req.user.id === userId && (role || isActive !== undefined)) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your full name'
      });
    }

    // Tenant admin restriction
    if (req.user.role !== 'tenant_admin' && req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const updates = [];
    const values = [];
    let idx = 1;

    if (fullName) {
      updates.push(`full_name = $${idx++}`);
      values.push(fullName);
    }
    if (req.user.role === 'tenant_admin' && role) {
      updates.push(`role = $${idx++}`);
      values.push(role);
    }
    if (req.user.role === 'tenant_admin' && isActive !== undefined) {
      updates.push(`is_active = $${idx++}`);
      values.push(isActive);
    }

    const updated = await pool.query(
      `
      UPDATE users
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING id, full_name, role, updated_at
      `,
      [...values, userId]
    );

    await logAudit({
      tenantId: targetUser.tenant_id,
      userId: req.user.id,
      action: 'UPDATE_USER',
      entityType: 'user',
      entityId: userId,
      ipAddress: req.ip
    });

    return success(res, updated.rows[0], 'User updated successfully');
  } catch (err) {
    next(err);
  }
};

/* =================================================
   API 11: DELETE USER
   DELETE /api/users/:userId
================================================= */
exports.deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (req.user.id === userId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete yourself'
      });
    }

    const userRes = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const targetUser = userRes.rows[0];

    if (req.user.role !== 'tenant_admin' ||
        targetUser.tenant_id !== req.user.tenantId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await pool.query(
      'DELETE FROM users WHERE id = $1',
      [userId]
    );

    await logAudit({
      tenantId: targetUser.tenant_id,
      userId: req.user.id,
      action: 'DELETE_USER',
      entityType: 'user',
      entityId: userId,
      ipAddress: req.ip
    });

    return success(res, null, 'User deleted successfully');
  } catch (err) {
    next(err);
  }
};
