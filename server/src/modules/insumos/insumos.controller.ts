import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/errors/AppError';
import { requireParam } from '../../shared/utils/params';
import { insumosService } from './insumos.service';

const requireTenant = (req: Request) => {
  if (!req.tenantId) throw AppError.unauthorized();
  return req.tenantId;
};

export const insumosController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await insumosService.list(requireTenant(req), req.query as never));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    res.json(await insumosService.getById(requireParam(req.params, 'id'), requireTenant(req)));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await insumosService.create(requireTenant(req), req.body));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    res.json(await insumosService.update(requireParam(req.params, 'id'), requireTenant(req), req.body));
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await insumosService.delete(requireParam(req.params, 'id'), requireTenant(req));
    res.status(204).send();
  }),

  estadisticas: asyncHandler(async (req: Request, res: Response) => {
    res.json(await insumosService.estadisticas(requireTenant(req), req.query as never));
  }),
};
