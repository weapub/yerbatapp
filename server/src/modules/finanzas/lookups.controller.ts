import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/errors/AppError';
import { requireParam } from '../../shared/utils/params';
import { categoriasService, centrosCostoService, cuentasService } from './lookups.service';

const requireTenant = (req: Request) => {
  if (!req.tenantId) throw AppError.unauthorized();
  return req.tenantId;
};

export const cuentasController = {
  list: asyncHandler(async (req: Request, res: Response) => res.json(await cuentasService.list(requireTenant(req)))),
  create: asyncHandler(async (req: Request, res: Response) =>
    res.status(201).json(await cuentasService.create(requireTenant(req), req.body)),
  ),
  update: asyncHandler(async (req: Request, res: Response) =>
    res.json(await cuentasService.update(requireParam(req.params, 'id'), requireTenant(req), req.body)),
  ),
  delete: asyncHandler(async (req: Request, res: Response) => {
    await cuentasService.delete(requireParam(req.params, 'id'), requireTenant(req));
    res.status(204).send();
  }),
};

export const categoriasController = {
  list: asyncHandler(async (req: Request, res: Response) => res.json(await categoriasService.list(requireTenant(req)))),
  create: asyncHandler(async (req: Request, res: Response) =>
    res.status(201).json(await categoriasService.create(requireTenant(req), req.body)),
  ),
  update: asyncHandler(async (req: Request, res: Response) =>
    res.json(await categoriasService.update(requireParam(req.params, 'id'), requireTenant(req), req.body)),
  ),
  delete: asyncHandler(async (req: Request, res: Response) => {
    await categoriasService.delete(requireParam(req.params, 'id'), requireTenant(req));
    res.status(204).send();
  }),
};

export const centrosCostoController = {
  list: asyncHandler(async (req: Request, res: Response) => res.json(await centrosCostoService.list(requireTenant(req)))),
  create: asyncHandler(async (req: Request, res: Response) =>
    res.status(201).json(await centrosCostoService.create(requireTenant(req), req.body)),
  ),
  update: asyncHandler(async (req: Request, res: Response) =>
    res.json(await centrosCostoService.update(requireParam(req.params, 'id'), requireTenant(req), req.body)),
  ),
  delete: asyncHandler(async (req: Request, res: Response) => {
    await centrosCostoService.delete(requireParam(req.params, 'id'), requireTenant(req));
    res.status(204).send();
  }),
};
