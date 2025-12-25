import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { getTenantDetails, updateTenant, listAllTenants } from '../services/tenantService.js';
import { updateTenantSchema } from '../validators/tenantValidators.js';
import { AuthenticatedRequest } from '../types/express.js';

const router = Router();

// GET /api/tenants/:tenantId - Get tenant details
router.get('/:tenantId', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await getTenantDetails(
      req.params.tenantId,
      req.user!.id,
      req.user!.role,
      req.user!.tenantId
    );
    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

// PUT /api/tenants/:tenantId - Update tenant
router.put('/:tenantId', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const parse = updateTenantSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ success: false, message: 'Validation error', data: parse.error.flatten() });
  }

  try {
    const result = await updateTenant(
      req.params.tenantId,
      parse.data,
      req.user!.id,
      req.user!.role,
      req.user!.tenantId
    );
    return res.status(200).json({ success: true, message: 'Tenant updated successfully', data: result });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

// GET /api/tenants - List all tenants (super_admin only)
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;
    const subscriptionPlan = req.query.subscriptionPlan as string | undefined;

    const result = await listAllTenants(req.user!.role, page, limit, status, subscriptionPlan);
    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

export default router;
