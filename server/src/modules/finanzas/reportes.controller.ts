import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/errors/AppError';
import { reportesService } from './reportes.service';

const requireTenant = (req: Request) => {
  if (!req.tenantId) throw AppError.unauthorized();
  return req.tenantId;
};

export const reportesController = {
  balance: asyncHandler(async (req: Request, res: Response) => {
    res.json(await reportesService.balance(requireTenant(req), req.query as never));
  }),

  flujoCaja: asyncHandler(async (req: Request, res: Response) => {
    res.json(await reportesService.flujoCaja(requireTenant(req), req.query as never));
  }),
};
