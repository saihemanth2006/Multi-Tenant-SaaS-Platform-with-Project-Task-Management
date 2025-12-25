import { z } from 'zod';

export const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['active', 'suspended', 'trial']).optional(),
  subscriptionPlan: z.enum(['free', 'pro', 'enterprise']).optional(),
  maxUsers: z.number().int().min(1).optional(),
  maxProjects: z.number().int().min(1).optional()
});
