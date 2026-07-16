import { NextFunction, Request, Response } from 'express';
import { RolUsuario } from '@prisma/client';
import { AppError } from '../shared/errors/AppError';

/** Debe usarse después de authMiddleware. Restringe el acceso a los roles indicados. */
export const rbac =
  (...roles: RolUsuario[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(AppError.unauthorized());
      return;
    }
    if (!roles.includes(req.auth.rol)) {
      next(AppError.forbidden());
      return;
    }
    next();
  };
