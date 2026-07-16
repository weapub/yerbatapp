import { NextFunction, Request, Response } from 'express';
import { AppError } from '../shared/errors/AppError';
import { AccessTokenPayload, verifyAccessToken } from '../shared/utils/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AccessTokenPayload;
    }
  }
}

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(AppError.unauthorized('Token de acceso faltante'));
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    next(AppError.unauthorized('Token de acceso inválido o expirado'));
  }
};
