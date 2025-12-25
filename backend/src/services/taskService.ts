import { pool, withTransaction } from '../db.js';
import { recordAudit } from './auditService.js';
import { PoolClient } from 'pg';

export async function createTask(
  projectId: string,
  params: {
    title: string;
    description?: string;
    assignedTo?: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
  },
  tenantId: string,
  userId: string
) {
  // Verify project exists and belongs to tenant
  const projectRes = await pool.query('SELECT id, tenant_id FROM projects WHERE id = $1', [projectId]);
  if (!projectRes.rowCount) {
    const err: any = new Error('Project not found');
    err.status = 404;
    throw err;
  }
  const project = projectRes.rows[0];
  if (project.tenant_id !== tenantId) {
    const err: any = new Error('Project does not belong to your tenant');
    err.status = 403;
    throw err;
  }

  // If assignedTo provided, verify user belongs to same tenant
  if (params.assignedTo) {
    const assignedUserRes = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
      [params.assignedTo, tenantId]
    );
    if (!assignedUserRes.rowCount) {
      const err: any = new Error('Assigned user does not belong to this tenant');
      err.status = 400;
      throw err;
    }
  }

  return withTransaction(async (client: PoolClient) => {
    const taskRes = await client.query(
      `INSERT INTO tasks (project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
       VALUES ($1, $2, $3, $4, 'todo', $5, $6, $7)
       RETURNING id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date, created_at`,
      [projectId, tenantId, params.title, params.description || null, params.priority, params.assignedTo || null, params.dueDate || null]
    );
    const task = taskRes.rows[0];

    await recordAudit(client, {
      tenantId,
      userId,
      action: 'CREATE_TASK',
      entityType: 'task',
      entityId: task.id
    });

    return {
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
    };
  });
}

export async function listProjectTasks(
  projectId: string,
  tenantId: string,
  status?: string,
  assignedTo?: string,
  priority?: string,
  search?: string,
  page: number = 1,
  limit: number = 50
) {
  // Verify project belongs to tenant
  const projectRes = await pool.query('SELECT id, tenant_id FROM projects WHERE id = $1', [projectId]);
  if (!projectRes.rowCount) {
    const err: any = new Error('Project not found');
    err.status = 404;
    throw err;
  }
  if (projectRes.rows[0].tenant_id !== tenantId) {
    const err: any = new Error('Project does not belong to your tenant');
    err.status = 403;
    throw err;
  }

  if (limit > 100) limit = 100;
  const offset = (page - 1) * limit;

  const filters = ['t.project_id = $1'];
  const params: any[] = [projectId];
  let paramCount = 2;

  if (status) {
    filters.push(`t.status = $${paramCount++}`);
    params.push(status);
  }
  if (assignedTo) {
    filters.push(`t.assigned_to = $${paramCount++}`);
    params.push(assignedTo);
  }
  if (priority) {
    filters.push(`t.priority = $${paramCount++}`);
    params.push(priority);
  }
  if (search) {
    filters.push(`t.title ILIKE $${paramCount++}`);
    params.push(`%${search}%`);
  }

  const whereClause = filters.join(' AND ');

  // Get total count
  const countRes = await pool.query(
    `SELECT COUNT(*) as count FROM tasks t WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countRes.rows[0].count);
  const totalPages = Math.ceil(total / limit);

  // Get tasks with assignee details
  const limitIndex = paramCount; // next placeholder index for LIMIT
  params.push(limit, offset);
  const tasksRes = await pool.query(
    `SELECT t.id, t.title, t.description, t.status, t.priority, t.assigned_to, t.due_date, t.created_at,
            u.full_name, u.email
     FROM tasks t
     LEFT JOIN users u ON t.assigned_to = u.id
     WHERE ${whereClause}
     ORDER BY CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END ASC, t.due_date ASC
     LIMIT $${limitIndex} OFFSET $${limitIndex + 1}`,
    params
  );

  const tasks = tasksRes.rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assignedTo: row.assigned_to
      ? {
          id: row.assigned_to,
          fullName: row.full_name,
          email: row.email
        }
      : null,
    dueDate: row.due_date,
    createdAt: row.created_at
  }));

  return {
    tasks,
    total,
    pagination: {
      currentPage: page,
      totalPages,
      limit
    }
  };
}

export async function updateTaskStatus(
  taskId: string,
  status: 'todo' | 'in_progress' | 'completed',
  tenantId: string,
  userId: string
) {
  const taskRes = await pool.query('SELECT id, tenant_id FROM tasks WHERE id = $1', [taskId]);
  if (!taskRes.rowCount) {
    const err: any = new Error('Task not found');
    err.status = 404;
    throw err;
  }
  if (taskRes.rows[0].tenant_id !== tenantId) {
    const err: any = new Error('Task does not belong to your tenant');
    err.status = 403;
    throw err;
  }

  return withTransaction(async (client: PoolClient) => {
    const updateRes = await client.query(
      `UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, status, updated_at`,
      [status, taskId]
    );

    await recordAudit(client, {
      tenantId,
      userId,
      action: 'UPDATE_TASK_STATUS',
      entityType: 'task',
      entityId: taskId
    });

    return {
      id: updateRes.rows[0].id,
      status: updateRes.rows[0].status,
      updatedAt: updateRes.rows[0].updated_at
    };
  });
}

export async function updateTask(
  taskId: string,
  updates: any,
  tenantId: string,
  userId: string
) {
  const taskRes = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
  if (!taskRes.rowCount) {
    const err: any = new Error('Task not found');
    err.status = 404;
    throw err;
  }
  const task = taskRes.rows[0];

  if (task.tenant_id !== tenantId) {
    const err: any = new Error('Task does not belong to your tenant');
    err.status = 403;
    throw err;
  }

  // If assignedTo provided, verify user belongs to same tenant
  if (updates.assignedTo !== undefined && updates.assignedTo !== null) {
    const assignedUserRes = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
      [updates.assignedTo, tenantId]
    );
    if (!assignedUserRes.rowCount) {
      const err: any = new Error('Assigned user does not belong to this tenant');
      err.status = 400;
      throw err;
    }
  }

  return withTransaction(async (client: PoolClient) => {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.priority !== undefined) {
      fields.push(`priority = $${paramCount++}`);
      values.push(updates.priority);
    }
    if (updates.assignedTo !== undefined) {
      fields.push(`assigned_to = $${paramCount++}`);
      values.push(updates.assignedTo);
    }
    if (updates.dueDate !== undefined) {
      fields.push(`due_date = $${paramCount++}`);
      values.push(updates.dueDate);
    }

    if (fields.length === 0) {
      const err: any = new Error('No valid fields to update');
      err.status = 400;
      throw err;
    }

    fields.push(`updated_at = NOW()`);
    values.push(taskId);

    const updateRes = await client.query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${paramCount} 
       RETURNING id, title, description, status, priority, assigned_to, due_date, updated_at`,
      values
    );
    const updated = updateRes.rows[0];

    // Fetch assignee details if present
    let assignedToDetails = null;
    if (updated.assigned_to) {
      const userRes = await client.query('SELECT id, full_name, email FROM users WHERE id = $1', [
        updated.assigned_to
      ]);
      if (userRes.rowCount) {
        const u = userRes.rows[0];
        assignedToDetails = { id: u.id, fullName: u.full_name, email: u.email };
      }
    }

    await recordAudit(client, {
      tenantId,
      userId,
      action: 'UPDATE_TASK',
      entityType: 'task',
      entityId: taskId
    });

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      status: updated.status,
      priority: updated.priority,
      assignedTo: assignedToDetails,
      dueDate: updated.due_date,
      updatedAt: updated.updated_at
    };
  });
}
