import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/errors/AppError';
import { requireParam } from '../../shared/utils/params';
import { clientesService } from './clientes.service';

const requireTenant = (req: Request) => {
  if (!req.tenantId) throw AppError.unauthorized();
  return req.tenantId;
};

export const clientesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await clientesService.list(requireTenant(req), req.query as never));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    res.json(await clientesService.getById(requireParam(req.params, 'id'), requireTenant(req)));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await clientesService.create(requireTenant(req), req.body));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    res.json(await clientesService.update(requireParam(req.params, 'id'), requireTenant(req), req.body));
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await clientesService.delete(requireParam(req.params, 'id'), requireTenant(req));
    res.status(204).send();
  }),

  listMovimientosCC: asyncHandler(async (req: Request, res: Response) => {
    res.json(await clientesService.listMovimientosCC(requireParam(req.params, 'id'), requireTenant(req)));
  }),

  registrarMovimientoCC: asyncHandler(async (req: Request, res: Response) => {
    const movimiento = await clientesService.registrarMovimientoCC(
      requireParam(req.params, 'id'),
      requireTenant(req),
      req.body,
    );
    res.status(201).json(movimiento);
  }),
};
