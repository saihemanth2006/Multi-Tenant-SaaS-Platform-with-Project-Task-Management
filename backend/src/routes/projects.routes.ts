import { Router, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { createProjectSchema, updateProjectSchema } from '../validators/projectValidators.js';
import { createProject, listProjects, getProject, updateProject, deleteProject } from '../services/projectService.js';
import { AuthenticatedRequest } from '../types/express.js';

const router = Router();

// POST /api/projects - Create project
router.post('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const parse = createProjectSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ success: false, message: 'Validation error', data: parse.error.flatten() });
  }

  try {
    const result = await createProject(parse.data, req.user!.tenantId!, req.user!.id);
    return res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

// GET /api/projects - List projects
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await listProjects(req.user!.tenantId!, status, search, page, limit);
    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

// GET /api/projects/:projectId - Get single project
router.get('/:projectId', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await getProject(req.params.projectId, req.user!.tenantId!);
    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

// PUT /api/projects/:projectId - Update project
router.put('/:projectId', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const parse = updateProjectSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ success: false, message: 'Validation error', data: parse.error.flatten() });
  }

  try {
    const result = await updateProject(
      req.params.projectId,
      parse.data,
      req.user!.tenantId!,
      req.user!.id,
      req.user!.role
    );
    return res.status(200).json({ success: true, message: 'Project updated successfully', data: result });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

// DELETE /api/projects/:projectId - Delete project
router.delete('/:projectId', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await deleteProject(
      req.params.projectId,
      req.user!.tenantId!,
      req.user!.id,
      req.user!.role
    );
    return res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

export default router;
