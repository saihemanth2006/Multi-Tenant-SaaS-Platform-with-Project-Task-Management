import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool, withTransaction } from '../db.js';
import { config } from '../config/env.js';
import { recordAudit } from './auditService.js';
import { PoolClient } from 'pg';

const JWT_EXPIRES_IN_SECONDS = 24 * 60 * 60;

export async function registerTenant(params: {
  tenantName: string;
  subdomain: string;
  adminEmail: string;
  adminPassword: string;
  adminFullName: string;
}) {
  const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = params;

  return withTransaction(async (client: PoolClient) => {
    const existingSub = await client.query('SELECT 1 FROM tenants WHERE subdomain = $1', [subdomain]);
    if (existingSub.rowCount) {
      const err: any = new Error('Subdomain already exists');
      err.status = 409;
      throw err;
    }

    const hashed = await bcrypt.hash(adminPassword, 10);

    const tenantInsert = await client.query(
      `INSERT INTO tenants (name, subdomain, status, subscription_plan)
       VALUES ($1, $2, 'active', 'free') RETURNING id, subdomain`,
      [tenantName, subdomain]
    );
    const tenant = tenantInsert.rows[0];

    const userInsert = await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, 'tenant_admin', TRUE)
       RETURNING id, email, full_name, role`,
      [tenant.id, adminEmail, hashed, adminFullName]
    );
    const admin = userInsert.rows[0];

    await recordAudit(client, {
      tenantId: tenant.id,
      userId: admin.id,
      action: 'REGISTER_TENANT',
      entityType: 'tenant',
      entityId: tenant.id,
      ipAddress: null
    });

    return {
      tenantId: tenant.id,
      subdomain: tenant.subdomain,
      adminUser: admin
    };
  });
}

export async function login(params: {
  email: string;
  password: string;
  tenantSubdomain?: string;
  tenantId?: string;
}) {
  const { email, password, tenantSubdomain, tenantId } = params;

  // Branch 1: Tenant-scoped login when context is provided
  if (tenantId || tenantSubdomain) {
    const tenantQuery = tenantId
      ? { text: 'SELECT * FROM tenants WHERE id = $1', values: [tenantId] }
      : { text: 'SELECT * FROM tenants WHERE subdomain = $1', values: [tenantSubdomain] };

    const tenantRes = await pool.query(tenantQuery);
    if (!tenantRes.rowCount) {
      const err: any = new Error('Tenant not found');
      err.status = 404;
      throw err;
    }
    const tenant = tenantRes.rows[0];
    if (tenant.status === 'suspended') {
      const err: any = new Error('Tenant suspended');
      err.status = 403;
      throw err;
    }

    const userRes = await pool.query(
      'SELECT * FROM users WHERE tenant_id = $1 AND email = $2',
      [tenant.id, email]
    );
    if (!userRes.rowCount) {
      const err: any = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }
    const user = userRes.rows[0];
    if (!user.is_active) {
      const err: any = new Error('Account inactive');
      err.status = 403;
      throw err;
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      const err: any = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role },
      config.jwtSecret,
      { expiresIn: JWT_EXPIRES_IN_SECONDS }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        tenantId: user.tenant_id
      },
      token,
      expiresIn: JWT_EXPIRES_IN_SECONDS
    };
  }

  // Branch 2: Super admin login without tenant context
  const superRes = await pool.query(
    `SELECT * FROM users WHERE email = $1 AND role = 'super_admin' AND tenant_id IS NULL`,
    [email]
  );
  if (!superRes.rowCount) {
    const err: any = new Error('tenantSubdomain or tenantId is required');
    err.status = 400;
    throw err;
  }
  const superUser = superRes.rows[0];
  if (!superUser.is_active) {
    const err: any = new Error('Account inactive');
    err.status = 403;
    throw err;
  }

  const match = await bcrypt.compare(password, superUser.password_hash);
  if (!match) {
    const err: any = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const token = jwt.sign(
    { userId: superUser.id, tenantId: superUser.tenant_id, role: superUser.role },
    config.jwtSecret,
    { expiresIn: JWT_EXPIRES_IN_SECONDS }
  );

  return {
    user: {
      id: superUser.id,
      email: superUser.email,
      fullName: superUser.full_name,
      role: superUser.role,
      tenantId: superUser.tenant_id
    },
    token,
    expiresIn: JWT_EXPIRES_IN_SECONDS
  };
}

export async function getCurrentUser(userId: string) {
  const res = await pool.query(
    `SELECT u.id, u.email, u.full_name, u.role, u.is_active,
            t.id as tenant_id, t.name as tenant_name, t.subdomain, t.subscription_plan,
            t.max_users, t.max_projects
     FROM users u
     LEFT JOIN tenants t ON u.tenant_id = t.id
     WHERE u.id = $1`,
    [userId]
  );
  if (!res.rowCount) {
    const err: any = new Error('User not found');
    err.status = 404;
    throw err;
  }
  const row = res.rows[0];
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    isActive: row.is_active,
    tenant: row.tenant_id
      ? {
          id: row.tenant_id,
          name: row.tenant_name,
          subdomain: row.subdomain,
          subscriptionPlan: row.subscription_plan,
          maxUsers: row.max_users,
          maxProjects: row.max_projects
        }
      : null
  };
}

export async function logout(userId: string, tenantId: string | null, ip: string | undefined) {
  await withTransaction(async (client: PoolClient) => {
    if (tenantId) {
      await recordAudit(client, {
        tenantId,
        userId,
        action: 'LOGOUT',
        entityType: 'user',
        entityId: userId,
        ipAddress: ip || null
      });
    }
  });
  return { success: true };
}
