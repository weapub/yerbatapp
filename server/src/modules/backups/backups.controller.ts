import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/errors/AppError';
import { requireParam } from '../../shared/utils/params';
import { backupsService } from './backups.service';

const requireTenant = (req: Request) => {
  if (!req.tenantId) throw AppError.unauthorized();
  return req.tenantId;
};

export const backupsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await backupsService.list(requireTenant(req)));
  }),

  crear: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await backupsService.crear(requireTenant(req), 'MANUAL'));
  }),

  descargar: asyncHandler(async (req: Request, res: Response) => {
    const { path, filename } = await backupsService.getArchivoPath(requireParam(req.params, 'id'), requireTenant(req));
    res.download(path, filename);
  }),

  restaurar: asyncHandler(async (req: Request, res: Response) => {
    await backupsService.restaurar(requireParam(req.params, 'id'), requireTenant(req));
    res.json({ message: 'Base de datos restaurada correctamente' });
  }),
};
