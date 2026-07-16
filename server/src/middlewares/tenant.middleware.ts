import { NextFunction, Request, Response } from 'express';
import { AppError } from '../shared/errors/AppError';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

/**
 * Resuelve el tenant activo a partir del JWT (req.auth.tenantId) y lo expone en
 * req.tenantId para que los repositorios filtren automáticamente por él.
 * Hoy existe un único tenant sembrado; cuando se active multi-tenant real, este
 * middleware es el único punto a tocar (ej. resolver por subdominio/header).
 */
export const tenantMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.auth?.tenantId) {
    next(AppError.unauthorized());
    return;
  }
  req.tenantId = req.auth.tenantId;
  next();
};
