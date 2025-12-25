import { Request } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      tenantId: string | null;
      role: 'super_admin' | 'tenant_admin' | 'user';
    };
  }
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string | null;
    role: 'super_admin' | 'tenant_admin' | 'user';
  };
}
