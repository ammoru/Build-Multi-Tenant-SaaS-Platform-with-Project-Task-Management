const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { signToken } = require('../utils/jwt');
const { success } = require('../utils/response');
const { logAudit } = require('../services/audit.service');
const jwt = require('jsonwebtoken');

const PLAN_LIMITS = {
  free: { users: 5, projects: 3 },
  pro: { users: 25, projects: 15 },
  enterprise: { users: 100, projects: 50 }
};

/* ===============================
   API 1: REGISTER TENANT
================================ */
exports.registerTenant = async (req, res, next) => {
  const {
    tenantName,
    subdomain,
    adminEmail,
    adminPassword,
    adminFullName
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check subdomain
    const subdomainExists = await client.query(
      'SELECT 1 FROM tenants WHERE subdomain = $1',
      [subdomain]
    );
    if (subdomainExists.rowCount > 0) {
      throw { status: 409, message: 'Subdomain already exists' };
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const plan = PLAN_LIMITS.free;

    // Create tenant
    const tenantResult = await client.query(
      `INSERT INTO tenants 
       (name, subdomain, subscription_plan, max_users, max_projects)
       VALUES ($1,$2,'free',$3,$4)
       RETURNING id`,
      [tenantName, subdomain, plan.users, plan.projects]
    );

    const tenantId = tenantResult.rows[0].id;

    // Create tenant admin
    const userResult = await client.query(
      `INSERT INTO users 
       (tenant_id, email, password_hash, full_name, role)
       VALUES ($1,$2,$3,$4,'tenant_admin')
       RETURNING id, email, full_name, role`,
      [tenantId, adminEmail, passwordHash, adminFullName]
    );

    await client.query('COMMIT');

    return success(res, {
      tenantId,
      subdomain,
      adminUser: {
        id: userResult.rows[0].id,
        email: userResult.rows[0].email,
        fullName: userResult.rows[0].full_name,
        role: userResult.rows[0].role
      }
    }, 'Tenant registered successfully', 201);

  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/* ===============================
   API 2: LOGIN
================================ */
exports.login = async (req, res, next) => {
  try {
    const { email, password, tenantSubdomain } = req.body;

    // 1️⃣ Find user by email FIRST
    const userRes = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userRes.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = userRes.rows[0];

    // 2️⃣ Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // 3️⃣ SUPER ADMIN LOGIN (NO TENANT CHECK)
    if (user.role === 'super_admin') {
      const token = jwt.sign(
        {
          userId: user.id,
          tenantId: null,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      return res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            tenantId: null
          },
          token,
          expiresIn: 86400
        }
      });
    }

    // 4️⃣ TENANT USER LOGIN (tenant_admin / user)
    if (!tenantSubdomain) {
      return res.status(400).json({
        success: false,
        message: 'Tenant subdomain is required'
      });
    }

    const tenantRes = await pool.query(
      'SELECT * FROM tenants WHERE subdomain = $1',
      [tenantSubdomain]
    );

    if (tenantRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    const tenant = tenantRes.rows[0];

    // Tenant status check
    if (tenant.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Tenant is not active'
      });
    }

    // Verify user belongs to tenant
    if (user.tenant_id !== tenant.id) {
      return res.status(403).json({
        success: false,
        message: 'User does not belong to this tenant'
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: tenant.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          tenantId: tenant.id
        },
        token,
        expiresIn: 86400
      }
    });

  } catch (err) {
    next(err);
  }
};



/* ===============================
   API 3: CURRENT USER
================================ */
exports.me = async (req, res, next) => {
  try {
    const userResult = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.is_active,
              t.id AS tenant_id, t.name, t.subdomain,
              t.subscription_plan, t.max_users, t.max_projects
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userResult.rowCount === 0) {
      throw { status: 404, message: 'User not found' };
    }

    const u = userResult.rows[0];

    return success(res, {
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      role: u.role,
      isActive: u.is_active,
      tenant: u.tenant_id ? {
        id: u.tenant_id,
        name: u.name,
        subdomain: u.subdomain,
        subscriptionPlan: u.subscription_plan,
        maxUsers: u.max_users,
        maxProjects: u.max_projects
      } : null
    });

  } catch (err) {
    next(err);
  }
};


/* ===============================
   API 4: LOGOUT
================================ */
exports.logout = async (req, res, next) => {
  try {
    await logAudit({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      action: 'LOGOUT',
      entityType: 'user',
      entityId: req.user.id,
      ipAddress: req.ip
    });

    return success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};
