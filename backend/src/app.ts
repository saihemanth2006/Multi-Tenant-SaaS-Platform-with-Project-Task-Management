import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import tenantRoutes from './routes/tenants.routes.js';
import userRoutes from './routes/users.routes.js';
import projectRoutes from './routes/projects.routes.js';
import taskRoutes from './routes/tasks.routes.js';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// CORS Configuration: Allow requests from frontend URL
// In Docker: http://frontend:3000 (service name)
// In local dev: http://localhost:3000
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/tenants', userRoutes);  // User routes under /api/tenants/:tenantId/users
app.use('/api/users', userRoutes);    // User routes under /api/users/:id
app.use('/api/projects', projectRoutes);
app.use('/api/projects', taskRoutes);
app.use('/api/tasks', taskRoutes);

app.use('/api/health', async (_req, res) => {
  try {
    await (await import('./db.js')).pool.query('SELECT 1');
    // Return status format for evaluation script
    res.json({ 
      success: true, 
      message: 'ok', 
      db: 'up',
      status: 'ok',
      database: 'connected'
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'db unreachable',
      status: 'error',
      database: 'disconnected'
    });
  }
});

app.use(errorHandler);

export default app;
