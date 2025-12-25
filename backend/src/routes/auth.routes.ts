import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { registerTenantSchema, loginSchema } from '../validators/authValidators.js';
import { getCurrentUser, login, logout, registerTenant } from '../services/authService.js';
import { recordAudit } from '../services/auditService.js';
import { pool, withTransaction } from '../db.js';
import { AuthenticatedRequest } from '../types/express.js';

const router = Router();

router.post('/register-tenant', async (req: Request, res: Response) => {
  const parse = registerTenantSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ success: false, message: 'Validation error', data: parse.error.flatten() });
  }
  try {
    const result = await registerTenant(parse.data);
    return res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      data: result
    });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Error registering tenant' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ success: false, message: 'Validation error', data: parse.error.flatten() });
  }
  try {
    const result = await login(parse.data);
    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Login failed' });
  }
});

router.get('/me', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await getCurrentUser(req.user!.id);
    return res.status(200).json({ success: true, data: user });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Failed to fetch user' });
  }
});

router.post('/logout', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await logout(req.user!.id, req.user!.tenantId, req.ip);
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Logout failed' });
  }
});

export default router;
