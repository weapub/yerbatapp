import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/errors/AppError';
import { requireParam } from '../../shared/utils/params';
import { cultivosService } from './cultivos.service';

const requireTenant = (req: Request) => {
  if (!req.tenantId) throw AppError.unauthorized();
  return req.tenantId;
};

export const cultivosController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await cultivosService.list(requireTenant(req), req.query as never));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    res.json(await cultivosService.getById(requireParam(req.params, 'id'), requireTenant(req)));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await cultivosService.create(requireTenant(req), req.body));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    res.json(await cultivosService.update(requireParam(req.params, 'id'), requireTenant(req), req.body));
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await cultivosService.delete(requireParam(req.params, 'id'), requireTenant(req));
    res.status(204).send();
  }),

  addHistorial: asyncHandler(async (req: Request, res: Response) => {
    const historial = await cultivosService.addHistorial(
      requireParam(req.params, 'id'),
      requireTenant(req),
      req.body,
    );
    res.status(201).json(historial);
  }),
};
