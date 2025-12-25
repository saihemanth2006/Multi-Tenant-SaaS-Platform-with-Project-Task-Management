import { Router, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { createUserSchema, updateUserSchema } from '../validators/authValidators.js';
import { createUser, listTenantUsers, updateUser, deleteUser } from '../services/userService.js';
import { AuthenticatedRequest } from '../types/express.js';

const router = Router();

// POST /api/tenants/:tenantId/users - Create user in tenant
router.post('/:tenantId/users', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const parse = createUserSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ success: false, message: 'Validation error', data: parse.error.flatten() });
  }

  try {
    const result = await createUser(
      req.params.tenantId,
      parse.data,
      req.user!.id,
      req.user!.role,
      req.user!.tenantId
    );
    return res.status(201).json({ success: true, message: 'User created successfully', data: result });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

// GET /api/tenants/:tenantId/users - List users in tenant
router.get('/:tenantId/users', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const role = req.query.role as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await listTenantUsers(
      req.params.tenantId,
      req.user!.id,
      req.user!.tenantId,
      search,
      role,
      page,
      limit
    );
    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

// PUT /api/users/:userId - Update user
router.put('/:userId', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const parse = updateUserSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ success: false, message: 'Validation error', data: parse.error.flatten() });
  }

  try {
    const result = await updateUser(
      req.params.userId,
      parse.data,
      req.user!.id,
      req.user!.role,
      req.user!.tenantId
    );
    return res.status(200).json({ success: true, message: 'User updated successfully', data: result });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

// DELETE /api/users/:userId - Delete user
router.delete('/:userId', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await deleteUser(req.params.userId, req.user!.id, req.user!.role, req.user!.tenantId);
    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

export default router;
