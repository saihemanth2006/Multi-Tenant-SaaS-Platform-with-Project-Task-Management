import { pool, withTransaction } from '../db.js';
import { PoolClient } from 'pg';
import { recordAudit } from './auditService.js';

export async function getTenantDetails(tenantId: string, requestingUserId: string, requestingRole: string, requestingTenantId: string | null) {
  // Check authorization: user must be in this tenant or be super_admin
  if (requestingRole !== 'super_admin' && requestingTenantId !== tenantId) {
    const err: any = new Error('Unauthorized access');
    err.status = 403;
    throw err;
  }

  const res = await pool.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
  if (!res.rowCount) {
    const err: any = new Error('Tenant not found');
    err.status = 404;
    throw err;
  }

  const tenant = res.rows[0];

  // Calculate stats
  const statsRes = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as total_users,
      (SELECT COUNT(*) FROM projects WHERE tenant_id = $1) as total_projects,
      (SELECT COUNT(*) FROM tasks WHERE tenant_id = $1) as total_tasks`,
    [tenantId]
  );
  const stats = statsRes.rows[0];

  return {
    id: tenant.id,
    name: tenant.name,
    subdomain: tenant.subdomain,
    status: tenant.status,
    subscriptionPlan: tenant.subscription_plan,
    maxUsers: tenant.max_users,
    maxProjects: tenant.max_projects,
    createdAt: tenant.created_at,
    stats: {
      totalUsers: parseInt(stats.total_users),
      totalProjects: parseInt(stats.total_projects),
      totalTasks: parseInt(stats.total_tasks)
    }
  };
}

export async function updateTenant(
  tenantId: string,
  updates: any,
  requestingUserId: string,
  requestingRole: string,
  requestingTenantId: string | null
) {
  // Check authorization: must be tenant_admin of this tenant or super_admin
  if (requestingRole !== 'tenant_admin' && requestingRole !== 'super_admin') {
    const err: any = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  // If tenant_admin, only allow updating name and check it's their tenant
  if (requestingRole === 'tenant_admin') {
    if (requestingTenantId !== tenantId) {
      const err: any = new Error('Unauthorized access');
      err.status = 403;
      throw err;
    }
    // Only allow name updates for tenant_admins
    const restrictedFields = ['status', 'subscriptionPlan', 'maxUsers', 'maxProjects'];
    for (const field of restrictedFields) {
      if (field in updates) {
        const err: any = new Error('Cannot update restricted fields');
        err.status = 403;
        throw err;
      }
    }
  }

  const tenant = await pool.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
  if (!tenant.rowCount) {
    const err: any = new Error('Tenant not found');
    err.status = 404;
    throw err;
  }

  return withTransaction(async (client: PoolClient) => {
    // Build update query dynamically
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.status !== undefined && requestingRole === 'super_admin') {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.subscriptionPlan !== undefined && requestingRole === 'super_admin') {
      fields.push(`subscription_plan = $${paramCount++}`);
      values.push(updates.subscriptionPlan);
    }
    // Note: maxUsers and maxProjects are generated from subscription_plan, so we don't update them directly
    // If a super_admin wants to override, they'd update subscription_plan

    if (fields.length === 0) {
      const err: any = new Error('No valid fields to update');
      err.status = 400;
      throw err;
    }

    fields.push(`updated_at = NOW()`);
    values.push(tenantId);

    const updateRes = await client.query(
      `UPDATE tenants SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id, updated_at, name`,
      values
    );

    await recordAudit(client, {
      tenantId,
      userId: requestingUserId,
      action: 'UPDATE_TENANT',
      entityType: 'tenant',
      entityId: tenantId
    });

    return {
      id: updateRes.rows[0].id,
      name: updateRes.rows[0].name,
      updatedAt: updateRes.rows[0].updated_at
    };
  });
}

export async function listAllTenants(
  requestingRole: string,
  page: number = 1,
  limit: number = 10,
  status?: string,
  subscriptionPlan?: string
) {
  if (requestingRole !== 'super_admin') {
    const err: any = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  // Enforce max limit
  if (limit > 100) limit = 100;
  const offset = (page - 1) * limit;

  // Build filters
  const filters: string[] = [];
  const params: any[] = [];
  let paramCount = 1;

  if (status) {
    filters.push(`status = $${paramCount++}`);
    params.push(status);
  }
  if (subscriptionPlan) {
    filters.push(`subscription_plan = $${paramCount++}`);
    params.push(subscriptionPlan);
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

  // Get total count
  const countRes = await pool.query(`SELECT COUNT(*) as count FROM tenants ${whereClause}`, params);
  const totalTenants = parseInt(countRes.rows[0].count);
  const totalPages = Math.ceil(totalTenants / limit);

  // Get tenants with stats
  params.push(limit, offset);
  const tenantsRes = await pool.query(
    `SELECT t.id, t.name, t.subdomain, t.status, t.subscription_plan, t.created_at,
            (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as total_users,
            (SELECT COUNT(*) FROM projects WHERE tenant_id = t.id) as total_projects
     FROM tenants t
     ${whereClause}
     ORDER BY t.created_at DESC
     LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
    params
  );

  const tenants = tenantsRes.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    subdomain: row.subdomain,
    status: row.status,
    subscriptionPlan: row.subscription_plan,
    totalUsers: parseInt(row.total_users),
    totalProjects: parseInt(row.total_projects),
    createdAt: row.created_at
  }));

  return {
    tenants,
    pagination: {
      currentPage: page,
      totalPages,
      totalTenants,
      limit
    }
  };
}
