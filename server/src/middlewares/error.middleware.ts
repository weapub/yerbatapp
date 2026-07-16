import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger';
import { isProduction } from '../config/env';
import { AppError } from '../shared/errors/AppError';

export const notFoundMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  next(AppError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorMiddleware = (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        error: { code: 'CONFLICT', message: 'Ya existe un registro con esos datos únicos', details: err.meta },
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
      return;
    }
  }

  logger.error({ err, path: req.originalUrl }, 'Error no controlado');

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction ? 'Error interno del servidor' : (err as Error)?.message,
    },
  });
};
