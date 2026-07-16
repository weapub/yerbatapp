import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/errors/AppError';
import { requireParam } from '../../shared/utils/params';
import { rendimientosService } from './rendimientos.service';

const requireTenant = (req: Request) => {
  if (!req.tenantId) throw AppError.unauthorized();
  return req.tenantId;
};

export const rendimientosController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await rendimientosService.list(requireTenant(req), req.query as never));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    res.json(await rendimientosService.getById(requireParam(req.params, 'id'), requireTenant(req)));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await rendimientosService.create(requireTenant(req), req.body));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    res.json(await rendimientosService.update(requireParam(req.params, 'id'), requireTenant(req), req.body));
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await rendimientosService.delete(requireParam(req.params, 'id'), requireTenant(req));
    res.status(204).send();
  }),

  comparativa: asyncHandler(async (req: Request, res: Response) => {
    res.json(await rendimientosService.comparativa(requireTenant(req), req.query as never));
  }),
};
