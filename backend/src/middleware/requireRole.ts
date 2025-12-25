import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types/express.js';

export function requireRole(roles: Array<'super_admin' | 'tenant_admin' | 'user'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  };
}
