const pool = require('../config/db');
const { success } = require('../utils/response');
const { logAudit } = require('../services/audit.service');

/* =================================================
   API 16: CREATE TASK
   POST /api/projects/:projectId/tasks
================================================= */
exports.createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority = 'medium', dueDate } = req.body;

    // 1️⃣ Verify project exists & belongs to user's tenant
    const projectRes = await pool.query(
      'SELECT id, tenant_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const project = projectRes.rows[0];

    if (req.user.role !== 'super_admin' && project.tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Project does not belong to your tenant'
      });
    }

    // 2️⃣ Validate assigned user belongs to same tenant
    if (assignedTo) {
      const userRes = await pool.query(
        'SELECT 1 FROM users WHERE id = $1 AND tenant_id = $2',
        [assignedTo, project.tenant_id]
      );

      if (userRes.rowCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user does not belong to this tenant'
        });
      }
    }

    // 3️⃣ Create task (tenant_id comes from project)
    const taskRes = await pool.query(
      `
      INSERT INTO tasks
        (project_id, tenant_id, title, description, priority, due_date)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        projectId,
        project.tenant_id,
        title,
        description,
        priority,
        dueDate
      ]
    );

    const task = taskRes.rows[0];

    await logAudit({
      tenantId: project.tenant_id,
      userId: req.user.id,
      action: 'CREATE_TASK',
      entityType: 'task',
      entityId: task.id,
      ipAddress: req.ip
    });

    return success(res, {
      id: task.id,
      projectId: task.project_id,
      tenantId: task.tenant_id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assigned_to,
      dueDate: task.due_date,
      createdAt: task.created_at
    }, null, 201);

  } catch (err) {
    next(err);
  }
};

/* =================================================
   API 17: LIST PROJECT TASKS
   GET /api/projects/:projectId/tasks
================================================= */
exports.listProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, assignedTo, priority, search } = req.query;

    const page = Number(req.query.page || 1);
    const limit = Math.min(Number(req.query.limit || 50), 100);
    const offset = (page - 1) * limit;

    // Verify project access
    const projectRes = await pool.query(
      'SELECT tenant_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const tenantId = projectRes.rows[0].tenant_id;

    if (req.user.role !== 'super_admin' && tenantId !== req.user.tenantId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const filters = ['t.project_id = $1'];
    const values = [projectId];
    let idx = 2;

    if (status) { filters.push(`t.status = $${idx}`); values.push(status); idx++; }
    if (assignedTo) { filters.push(`t.assigned_to = $${idx}`); values.push(assignedTo); idx++; }
    if (priority) { filters.push(`t.priority = $${idx}`); values.push(priority); idx++; }
    if (search) {
      filters.push(`t.title ILIKE $${idx}`);
      values.push(`%${search}%`);
      idx++;
    }

    const whereClause = filters.join(' AND ');

    const dataRes = await pool.query(
      `
      SELECT
        t.id, t.title, t.description, t.status, t.priority, t.due_date, t.created_at,
        u.id AS user_id, u.full_name, u.email
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE ${whereClause}
      ORDER BY
        CASE t.priority
          WHEN 'high' THEN 3
          WHEN 'medium' THEN 2
          ELSE 1
        END DESC,
        t.due_date ASC
      LIMIT $${idx} OFFSET $${idx + 1}
      `,
      [...values, limit, offset]
    );

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM tasks t WHERE ${whereClause}`,
      values
    );

    return success(res, {
      tasks: dataRes.rows.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        assignedTo: t.user_id ? {
          id: t.user_id,
          fullName: t.full_name,
          email: t.email
        } : null,
        dueDate: t.due_date,
        createdAt: t.created_at
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
   API 18: UPDATE TASK STATUS
   PATCH /api/tasks/:taskId/status
================================================= */
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const taskRes = await pool.query(
      'SELECT id, tenant_id FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = taskRes.rows[0];

    if (req.user.role !== 'super_admin' && task.tenant_id !== req.user.tenantId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const updated = await pool.query(
      `
      UPDATE tasks
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, status, updated_at
      `,
      [status, taskId]
    );

    return success(res, updated.rows[0]);
  } catch (err) {
    next(err);
  }
};

/* =================================================
   API 19: UPDATE TASK (ALL FIELDS)
   PUT /api/tasks/:taskId
================================================= */
exports.updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    const taskRes = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const task = taskRes.rows[0];

    if (req.user.role !== 'super_admin' && task.tenant_id !== req.user.tenantId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (assignedTo) {
      const userRes = await pool.query(
        'SELECT 1 FROM users WHERE id = $1 AND tenant_id = $2',
        [assignedTo, task.tenant_id]
      );
      if (userRes.rowCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user does not belong to this tenant'
        });
      }
    }

    const updates = [];
    const values = [];
    let idx = 1;

    if (title) { updates.push(`title = $${idx++}`); values.push(title); }
    if (description) { updates.push(`description = $${idx++}`); values.push(description); }
    if (status) { updates.push(`status = $${idx++}`); values.push(status); }
    if (priority) { updates.push(`priority = $${idx++}`); values.push(priority); }
    if (assignedTo !== undefined) {
      updates.push(`assigned_to = $${idx++}`);
      values.push(assignedTo);
    }
    if (dueDate !== undefined) {
      updates.push(`due_date = $${idx++}`);
      values.push(dueDate);
    }

    const updated = await pool.query(
      `
      UPDATE tasks
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING *
      `,
      [...values, taskId]
    );

    await logAudit({
      tenantId: task.tenant_id,
      userId: req.user.id,
      action: 'UPDATE_TASK',
      entityType: 'task',
      entityId: taskId,
      ipAddress: req.ip
    });

    const t = updated.rows[0];

    return success(res, {
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      assignedTo: t.assigned_to,
      dueDate: t.due_date,
      updatedAt: t.updated_at
    }, 'Task updated successfully');

  } catch (err) {
    next(err);
  }
};
