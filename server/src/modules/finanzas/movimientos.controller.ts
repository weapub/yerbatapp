import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/errors/AppError';
import { requireParam } from '../../shared/utils/params';
import { publicUrlFor } from '../../shared/utils/upload';
import { movimientosService } from './movimientos.service';

const requireTenant = (req: Request) => {
  if (!req.tenantId) throw AppError.unauthorized();
  return req.tenantId;
};

export const movimientosController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await movimientosService.list(requireTenant(req), req.query as never));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    res.json(await movimientosService.getById(requireParam(req.params, 'id'), requireTenant(req)));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await movimientosService.create(requireTenant(req), req.body));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    res.json(await movimientosService.update(requireParam(req.params, 'id'), requireTenant(req), req.body));
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await movimientosService.delete(requireParam(req.params, 'id'), requireTenant(req));
    res.status(204).send();
  }),

  addAdjunto: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = requireTenant(req);
    if (!req.file) throw AppError.badRequest('Archivo requerido');
    const adjunto = await movimientosService.addAdjunto(requireParam(req.params, 'id'), tenantId, {
      url: publicUrlFor('finanzas', req.file.filename),
      nombreArchivo: req.file.originalname,
    });
    res.status(201).json(adjunto);
  }),
};
