import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/errors/AppError';
import { requireParam } from '../../shared/utils/params';
import { proveedoresService } from './proveedores.service';

const requireTenant = (req: Request) => {
  if (!req.tenantId) throw AppError.unauthorized();
  return req.tenantId;
};

export const proveedoresController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await proveedoresService.list(requireTenant(req), req.query as never));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    res.json(await proveedoresService.getById(requireParam(req.params, 'id'), requireTenant(req)));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await proveedoresService.create(requireTenant(req), req.body));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    res.json(await proveedoresService.update(requireParam(req.params, 'id'), requireTenant(req), req.body));
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await proveedoresService.delete(requireParam(req.params, 'id'), requireTenant(req));
    res.status(204).send();
  }),

  createProducto: asyncHandler(async (req: Request, res: Response) => {
    const producto = await proveedoresService.createProducto(
      requireParam(req.params, 'id'),
      requireTenant(req),
      req.body,
    );
    res.status(201).json(producto);
  }),

  historialAplicaciones: asyncHandler(async (req: Request, res: Response) => {
    res.json(
      await proveedoresService.historialAplicaciones(requireParam(req.params, 'id'), requireTenant(req)),
    );
  }),

  listMovimientosCC: asyncHandler(async (req: Request, res: Response) => {
    res.json(await proveedoresService.listMovimientosCC(requireParam(req.params, 'id'), requireTenant(req)));
  }),

  registrarMovimientoCC: asyncHandler(async (req: Request, res: Response) => {
    const movimiento = await proveedoresService.registrarMovimientoCC(
      requireParam(req.params, 'id'),
      requireTenant(req),
      req.body,
    );
    res.status(201).json(movimiento);
  }),
};
