import { z } from 'zod';

export const registerTenantSchema = z.object({
  tenantName: z.string().min(1),
  subdomain: z.string().min(1),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  adminFullName: z.string().min(1)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantSubdomain: z.string().optional(),
  tenantId: z.string().optional()
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  role: z.enum(['user', 'tenant_admin']).default('user')
});

export const updateUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  role: z.enum(['user', 'tenant_admin']).optional(),
  isActive: z.boolean().optional()
});
