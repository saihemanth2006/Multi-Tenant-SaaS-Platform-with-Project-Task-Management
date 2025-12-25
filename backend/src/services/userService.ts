import bcrypt from 'bcrypt';
import { pool, withTransaction } from '../db.js';
import { recordAudit } from './auditService.js';
import { PoolClient } from 'pg';

export async function createUser(
  tenantId: string,
  params: {
    email: string;
    password: string;
    fullName: string;
    role: 'user' | 'tenant_admin';
  },
  requestingUserId: string,
  requestingRole: string,
  requestingTenantId: string | null
) {
  // Authorization: Only tenant_admin can create users
  if (requestingRole !== 'tenant_admin' || requestingTenantId !== tenantId) {
    const err: any = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }

  // Check if tenant exists
  const tenantRes = await pool.query('SELECT max_users FROM tenants WHERE id = $1', [tenantId]);
  if (!tenantRes.rowCount) {
    const err: any = new Error('Tenant not found');
    err.status = 404;
    throw err;
  }
  const tenant = tenantRes.rows[0];

  // Check user count vs limit
  const userCountRes = await pool.query(
    'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1',
    [tenantId]
  );
  const currentCount = parseInt(userCountRes.rows[0].count);
  if (currentCount >= tenant.max_users) {
    const err: any = new Error('Subscription limit reached');
    err.status = 403;
    throw err;
  }

  // Check if email already exists in this tenant
  const emailRes = await pool.query(
    'SELECT 1 FROM users WHERE tenant_id = $1 AND email = $2',
    [tenantId, params.email]
  );
  if (emailRes.rowCount) {
    const err: any = new Error('Email already exists in this tenant');
    err.status = 409;
    throw err;
  }

  return withTransaction(async (client: PoolClient) => {
    const hashed = await bcrypt.hash(params.password, 10);

    const userRes = await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, email, full_name, role, is_active, created_at`,
      [tenantId, params.email, hashed, params.fullName, params.role]
    );
    const user = userRes.rows[0];

    await recordAudit(client, {
      tenantId,
      userId: requestingUserId,
      action: 'CREATE_USER',
      entityType: 'user',
      entityId: user.id
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      tenantId,
      isActive: user.is_active,
      createdAt: user.created_at
    };
  });
}

export async function listTenantUsers(
  tenantId: string,
  requestingUserId: string,
  requestingTenantId: string | null,
  search?: string,
  role?: string,
  page: number = 1,
  limit: number = 50
) {
  // Authorization: User must belong to this tenant
  if (requestingTenantId !== tenantId) {
    const err: any = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }

  if (limit > 100) limit = 100;
  const offset = (page - 1) * limit;

  // Build filters
  const filters = ['tenant_id = $1'];
  const params: any[] = [tenantId];
  let paramCount = 2;

  if (search) {
    filters.push(`(full_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`);
    params.push(`%${search}%`);
    paramCount++;
  }

  if (role) {
    filters.push(`role = $${paramCount}`);
    params.push(role);
    paramCount++;
  }

  const whereClause = filters.join(' AND ');

  // Get total count
  const countRes = await pool.query(
    `SELECT COUNT(*) as count FROM users WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countRes.rows[0].count);
  const totalPages = Math.ceil(total / limit);

  // Get users
  params.push(limit, offset);
  const usersRes = await pool.query(
    `SELECT id, email, full_name, role, is_active, created_at
     FROM users
     WHERE ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
    params
  );

  const users = usersRes.rows.map((row: any) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at
  }));

  return {
    users,
    total,
    pagination: {
      currentPage: page,
      totalPages,
      limit
    }
  };
}

export async function updateUser(
  userId: string,
  updates: any,
  requestingUserId: string,
  requestingRole: string,
  requestingTenantId: string | null
) {
  const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  if (!userRes.rowCount) {
    const err: any = new Error('User not found');
    err.status = 404;
    throw err;
  }
  const user = userRes.rows[0];

  // Authorization: User can update themselves (fullName only) or tenant_admin can update
  if (requestingUserId !== userId && requestingRole !== 'tenant_admin') {
    const err: any = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }

  // If tenant_admin, verify they're in same tenant
  if (requestingRole === 'tenant_admin' && requestingTenantId !== user.tenant_id) {
    const err: any = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }

  // If user is updating themselves, only allow fullName
  if (requestingUserId === userId && requestingRole !== 'tenant_admin') {
    if ('role' in updates || 'isActive' in updates) {
      const err: any = new Error('Cannot update restricted fields');
      err.status = 403;
      throw err;
    }
  }

  // Build update query
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.fullName !== undefined) {
    fields.push(`full_name = $${paramCount++}`);
    values.push(updates.fullName);
  }
  if (updates.role !== undefined && requestingRole === 'tenant_admin') {
    fields.push(`role = $${paramCount++}`);
    values.push(updates.role);
  }
  if (updates.isActive !== undefined && requestingRole === 'tenant_admin') {
    fields.push(`is_active = $${paramCount++}`);
    values.push(updates.isActive);
  }

  if (fields.length === 0) {
    const err: any = new Error('No valid fields to update');
    err.status = 400;
    throw err;
  }

  fields.push(`updated_at = NOW()`);
  values.push(userId);

  return withTransaction(async (client: PoolClient) => {
    const updateRes = await client.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id, full_name, role, updated_at`,
      values
    );

    await recordAudit(client, {
      tenantId: user.tenant_id,
      userId: requestingUserId,
      action: 'UPDATE_USER',
      entityType: 'user',
      entityId: userId
    });

    return {
      id: updateRes.rows[0].id,
      fullName: updateRes.rows[0].full_name,
      role: updateRes.rows[0].role,
      updatedAt: updateRes.rows[0].updated_at
    };
  });
}

export async function deleteUser(
  userId: string,
  requestingUserId: string,
  requestingRole: string,
  requestingTenantId: string | null
) {
  // Authorization: Only tenant_admin can delete
  if (requestingRole !== 'tenant_admin') {
    const err: any = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }

  // Cannot delete self
  if (requestingUserId === userId) {
    const err: any = new Error('Cannot delete yourself');
    err.status = 403;
    throw err;
  }

  const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  if (!userRes.rowCount) {
    const err: any = new Error('User not found');
    err.status = 404;
    throw err;
  }
  const user = userRes.rows[0];

  // Verify user belongs to same tenant
  if (requestingTenantId !== user.tenant_id) {
    const err: any = new Error('Unauthorized');
    err.status = 403;
    throw err;
  }

  return withTransaction(async (client: PoolClient) => {
    // Set assigned_to to NULL for tasks assigned to this user
    await client.query('UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1', [userId]);

    // Delete user
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await recordAudit(client, {
      tenantId: user.tenant_id,
      userId: requestingUserId,
      action: 'DELETE_USER',
      entityType: 'user',
      entityId: userId
    });
  });
}
