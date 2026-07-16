import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/errors/AppError';
import { requireParam } from '../../shared/utils/params';
import { publicUrlFor } from '../../shared/utils/upload';
import { configuracionService } from './configuracion.service';

const requireTenant = (req: Request) => {
  if (!req.tenantId) throw AppError.unauthorized();
  return req.tenantId;
};

export const configuracionController = {
  getEmpresa: asyncHandler(async (req: Request, res: Response) => {
    res.json(await configuracionService.getEmpresa(requireTenant(req)));
  }),

  updateEmpresa: asyncHandler(async (req: Request, res: Response) => {
    res.json(await configuracionService.updateEmpresa(requireTenant(req), req.body));
  }),

  updateLogo: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = requireTenant(req);
    if (!req.file) throw AppError.badRequest('Archivo requerido');
    const logoUrl = publicUrlFor('empresa', req.file.filename);
    res.json(await configuracionService.updateLogo(tenantId, logoUrl));
  }),

  listParametros: asyncHandler(async (req: Request, res: Response) => {
    res.json(await configuracionService.listParametros(requireTenant(req)));
  }),

  upsertParametro: asyncHandler(async (req: Request, res: Response) => {
    const clave = requireParam(req.params, 'clave');
    res.json(await configuracionService.upsertParametro(requireTenant(req), clave, req.body.valor));
  }),

  deleteParametro: asyncHandler(async (req: Request, res: Response) => {
    await configuracionService.deleteParametro(requireTenant(req), requireParam(req.params, 'clave'));
    res.status(204).send();
  }),
};
