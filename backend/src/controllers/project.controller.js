const pool = require('../config/db');
const { success } = require('../utils/response');
const { logAudit } = require('../services/audit.service');

/* =================================================
   API 12: CREATE PROJECT
   POST /api/projects
================================================= */
exports.createProject = async (req, res, next) => {
  try {
    const { name, description, status = 'active' } = req.body;
    const tenantId = req.user.tenantId;
    const createdBy = req.user.id;

    // Check project limit
    const tenantRes = await pool.query(
      'SELECT max_projects FROM tenants WHERE id = $1',
      [tenantId]
    );

    const countRes = await pool.query(
      'SELECT COUNT(*) FROM projects WHERE tenant_id = $1',
      [tenantId]
    );

    if (Number(countRes.rows[0].count) >= tenantRes.rows[0].max_projects) {
      return res.status(403).json({
        success: false,
        message: 'Project limit reached'
      });
    }

    const projectRes = await pool.query(
      `
      INSERT INTO projects (tenant_id, name, description, status, created_by)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id, tenant_id, name, description, status, created_by, created_at
      `,
      [tenantId, name, description, status, createdBy]
    );

    const project = projectRes.rows[0];

    await logAudit({
      tenantId,
      userId: createdBy,
      action: 'CREATE_PROJECT',
      entityType: 'project',
      entityId: project.id,
      ipAddress: req.ip
    });

    return success(res, {
      id: project.id,
      tenantId: project.tenant_id,
      name: project.name,
      description: project.description,
      status: project.status,
      createdBy: project.created_by,
      createdAt: project.created_at
    }, null, 201);
  } catch (err) {
    next(err);
  }
};

/* =================================================
   API 13: LIST PROJECTS
   GET /api/projects
================================================= */
exports.listProjects = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { status, search } = req.query;

    const page = Number(req.query.page || 1);
    const limit = Math.min(Number(req.query.limit || 20), 100);
    const offset = (page - 1) * limit;

    const filters = ['p.tenant_id = $1'];
    const values = [tenantId];
    let idx = 2;

    if (status) {
      filters.push(`p.status = $${idx}`);
      values.push(status);
      idx++;
    }

    if (search) {
      filters.push(`p.name ILIKE $${idx}`);
      values.push(`%${search}%`);
      idx++;
    }

    const whereClause = filters.join(' AND ');

    const dataRes = await pool.query(
      `
      SELECT
        p.id, p.name, p.description, p.status, p.created_at,
        u.id AS creator_id, u.full_name AS creator_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') AS completed_task_count
      FROM projects p
      JOIN users u ON u.id = p.created_by
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
      `,
      [...values, limit, offset]
    );

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM projects p WHERE ${whereClause}`,
      values
    );

    return success(res, {
      projects: dataRes.rows.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        createdBy: {
          id: p.creator_id,
          fullName: p.creator_name
        },
        taskCount: Number(p.task_count),
        completedTaskCount: Number(p.completed_task_count),
        createdAt: p.created_at
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
   API 14: UPDATE PROJECT
   PUT /api/projects/:projectId
================================================= */
exports.updateProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, description, status } = req.body;

    const projectRes = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const project = projectRes.rows[0];

    if (
      req.user.role !== 'tenant_admin' &&
      project.created_by !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updates = [];
    const values = [];
    let idx = 1;

    if (name) { updates.push(`name = $${idx++}`); values.push(name); }
    if (description) { updates.push(`description = $${idx++}`); values.push(description); }
    if (status) { updates.push(`status = $${idx++}`); values.push(status); }

    const updated = await pool.query(
      `
      UPDATE projects
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING id, name, description, status, updated_at
      `,
      [...values, projectId]
    );

    await logAudit({
      tenantId: project.tenant_id,
      userId: req.user.id,
      action: 'UPDATE_PROJECT',
      entityType: 'project',
      entityId: projectId,
      ipAddress: req.ip
    });

    return success(res, updated.rows[0], 'Project updated successfully');
  } catch (err) {
    next(err);
  }
};

/* =================================================
   API 15: DELETE PROJECT
   DELETE /api/projects/:projectId
================================================= */
exports.deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const projectRes = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const project = projectRes.rows[0];

    if (
      req.user.role !== 'tenant_admin' &&
      project.created_by !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);

    await logAudit({
      tenantId: project.tenant_id,
      userId: req.user.id,
      action: 'DELETE_PROJECT',
      entityType: 'project',
      entityId: projectId,
      ipAddress: req.ip
    });

    return success(res, null, 'Project deleted successfully');
  } catch (err) {
    next(err);
  }
};
