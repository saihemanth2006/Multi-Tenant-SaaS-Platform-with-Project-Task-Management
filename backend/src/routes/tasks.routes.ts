import { Router, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { createTaskSchema, updateTaskStatusSchema, updateTaskSchema } from '../validators/taskValidators.js';
import { createTask, listProjectTasks, updateTaskStatus, updateTask } from '../services/taskService.js';
import { AuthenticatedRequest } from '../types/express.js';

const router = Router();

// POST /api/projects/:projectId/tasks - Create task
router.post('/:projectId/tasks', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const parse = createTaskSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ success: false, message: 'Validation error', data: parse.error.flatten() });
  }

  try {
    const result = await createTask(req.params.projectId, parse.data, req.user!.tenantId!, req.user!.id);
    return res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

// GET /api/projects/:projectId/tasks - List project tasks
router.get('/:projectId/tasks', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const assignedTo = req.query.assignedTo as string | undefined;
    const priority = req.query.priority as string | undefined;
    const search = req.query.search as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await listProjectTasks(
      req.params.projectId,
      req.user!.tenantId!,
      status,
      assignedTo,
      priority,
      search,
      page,
      limit
    );
    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

// PATCH /api/tasks/:taskId/status - Update task status only
router.patch('/:taskId/status', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const parse = updateTaskStatusSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ success: false, message: 'Validation error', data: parse.error.flatten() });
  }

  try {
    const result = await updateTaskStatus(req.params.taskId, parse.data.status, req.user!.tenantId!, req.user!.id);
    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

// PUT /api/tasks/:taskId - Update task
router.put('/:taskId', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const parse = updateTaskSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ success: false, message: 'Validation error', data: parse.error.flatten() });
  }

  try {
    const result = await updateTask(req.params.taskId, parse.data, req.user!.tenantId!, req.user!.id);
    return res.status(200).json({ success: true, message: 'Task updated successfully', data: result });
  } catch (err: any) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message });
  }
});

export default router;
