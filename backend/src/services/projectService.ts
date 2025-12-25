import { pool, withTransaction } from '../db.js';
import { recordAudit } from './auditService.js';
import { PoolClient } from 'pg';

export async function createProject(
  params: {
    name: string;
    description?: string;
    status: 'active' | 'archived' | 'completed';
  },
  tenantId: string,
  userId: string
) {
  // Check current project count vs limit
  const tenantRes = await pool.query('SELECT max_projects FROM tenants WHERE id = $1', [tenantId]);
  if (!tenantRes.rowCount) {
    const err: any = new Error('Tenant not found');
    err.status = 404;
    throw err;
  }
  const tenant = tenantRes.rows[0];

  const projectCountRes = await pool.query(
    'SELECT COUNT(*) as count FROM projects WHERE tenant_id = $1',
    [tenantId]
  );
  const currentCount = parseInt(projectCountRes.rows[0].count);
  if (currentCount >= tenant.max_projects) {
    const err: any = new Error('Project limit reached');
    err.status = 403;
    throw err;
  }

  return withTransaction(async (client: PoolClient) => {
    const projectRes = await client.query(
      `INSERT INTO projects (tenant_id, name, description, status, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, tenant_id, name, description, status, created_by, created_at`,
      [tenantId, params.name, params.description || null, params.status, userId]
    );
    const project = projectRes.rows[0];

    await recordAudit(client, {
      tenantId,
      userId,
      action: 'CREATE_PROJECT',
      entityType: 'project',
      entityId: project.id
    });

    return {
      id: project.id,
      tenantId: project.tenant_id,
      name: project.name,
      description: project.description,
      status: project.status,
      createdBy: project.created_by,
      createdAt: project.created_at
    };
  });
}

export async function listProjects(
  tenantId: string,
  status?: string,
  search?: string,
  page: number = 1,
  limit: number = 20
) {
  if (limit > 100) limit = 100;
  const offset = (page - 1) * limit;

  const filters = ['p.tenant_id = $1'];
  const params: any[] = [tenantId];
  let paramCount = 2;

  if (status) {
    filters.push(`p.status = $${paramCount++}`);
    params.push(status);
  }

  if (search) {
    filters.push(`p.name ILIKE $${paramCount++}`);
    params.push(`%${search}%`);
  }

  const whereClause = filters.join(' AND ');

  // Get total count
  const countRes = await pool.query(
    `SELECT COUNT(*) as count FROM projects p WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countRes.rows[0].count);
  const totalPages = Math.ceil(total / limit);

  // Get projects with stats
  const projectsRes = await pool.query(
    `SELECT p.id, p.name, p.description, p.status, p.created_by, p.created_at,
            u.full_name,
            (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
            (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_task_count
     FROM projects p
     LEFT JOIN users u ON p.created_by = u.id
     WHERE ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
    [...params, limit, offset]
  );

  const projects = projectsRes.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    createdBy: {
      id: row.created_by,
      fullName: row.full_name
    },
    taskCount: parseInt(row.task_count),
    completedTaskCount: parseInt(row.completed_task_count),
    createdAt: row.created_at
  }));

  return {
    projects,
    total,
    pagination: {
      currentPage: page,
      totalPages,
      limit
    }
  };
}

export async function getProject(projectId: string, tenantId: string) {
  const projectRes = await pool.query(
    `SELECT p.id, p.name, p.description, p.status, p.created_by, p.created_at, p.updated_at,
            u.full_name,
            (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
            (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_task_count
     FROM projects p
     LEFT JOIN users u ON p.created_by = u.id
     WHERE p.id = $1 AND p.tenant_id = $2`,
    [projectId, tenantId]
  );

  if (!projectRes.rowCount) {
    const err: any = new Error('Project not found');
    err.status = 404;
    throw err;
  }

  const row = projectRes.rows[0];
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    createdBy: {
      id: row.created_by,
      fullName: row.full_name
    },
    taskCount: parseInt(row.task_count),
    completedTaskCount: parseInt(row.completed_task_count),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function updateProject(
  projectId: string,
  updates: any,
  tenantId: string,
  userId: string,
  userRole: string
) {
  const projectRes = await pool.query('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2', [
    projectId,
    tenantId
  ]);
  if (!projectRes.rowCount) {
    const err: any = new Error('Project not found or belongs to different tenant');
    err.status = 404;
    throw err;
  }
  const project = projectRes.rows[0];

  // Authorization: tenant_admin or creator can update
  if (userRole !== 'tenant_admin' && project.created_by !== userId) {
    const err: any = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }

  return withTransaction(async (client: PoolClient) => {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }

    if (fields.length === 0) {
      const err: any = new Error('No valid fields to update');
      err.status = 400;
      throw err;
    }

    fields.push(`updated_at = NOW()`);
    values.push(projectId);

    const updateRes = await client.query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id, name, description, status, updated_at`,
      values
    );

    await recordAudit(client, {
      tenantId,
      userId,
      action: 'UPDATE_PROJECT',
      entityType: 'project',
      entityId: projectId
    });

    return {
      id: updateRes.rows[0].id,
      name: updateRes.rows[0].name,
      description: updateRes.rows[0].description,
      status: updateRes.rows[0].status,
      updatedAt: updateRes.rows[0].updated_at
    };
  });
}

export async function deleteProject(
  projectId: string,
  tenantId: string,
  userId: string,
  userRole: string
) {
  const projectRes = await pool.query('SELECT * FROM projects WHERE id = $1 AND tenant_id = $2', [
    projectId,
    tenantId
  ]);
  if (!projectRes.rowCount) {
    const err: any = new Error('Project not found or belongs to different tenant');
    err.status = 404;
    throw err;
  }
  const project = projectRes.rows[0];

  // Authorization: tenant_admin or creator can delete
  if (userRole !== 'tenant_admin' && project.created_by !== userId) {
    const err: any = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }

  return withTransaction(async (client: PoolClient) => {
    // Delete tasks first (cascade handled by FK)
    await client.query('DELETE FROM tasks WHERE project_id = $1', [projectId]);

    // Delete project
    await client.query('DELETE FROM projects WHERE id = $1', [projectId]);

    await recordAudit(client, {
      tenantId,
      userId,
      action: 'DELETE_PROJECT',
      entityType: 'project',
      entityId: projectId
    });
  });
}
