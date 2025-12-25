import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AuthenticatedRequest } from '../types/express.js';

interface TokenPayload {
  userId: string;
  tenantId: string | null;
  role: 'super_admin' | 'tenant_admin' | 'user';
  exp: number;
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing token' });
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
    req.user = {
      id: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}
