import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/errors/AppError';
import { requireParam } from '../../shared/utils/params';
import { publicUrlFor } from '../../shared/utils/upload';
import { facturasService } from './facturas.service';
import { ivaService } from './iva.service';
import { exportarIvaExcel, exportarIvaPdf } from './facturas.export';
import { ExportarIvaQuery } from './facturas.validation';

const requireTenant = (req: Request) => {
  if (!req.tenantId) throw AppError.unauthorized();
  return req.tenantId;
};

export const facturasController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await facturasService.list(requireTenant(req), req.query as never));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    res.json(await facturasService.getById(requireParam(req.params, 'id'), requireTenant(req)));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await facturasService.create(requireTenant(req), req.body));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    res.json(await facturasService.update(requireParam(req.params, 'id'), requireTenant(req), req.body));
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await facturasService.delete(requireParam(req.params, 'id'), requireTenant(req));
    res.status(204).send();
  }),

  addAdjunto: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = requireTenant(req);
    if (!req.file) throw AppError.badRequest('Archivo requerido');
    const adjunto = await facturasService.addAdjunto(requireParam(req.params, 'id'), tenantId, {
      url: publicUrlFor('facturas', req.file.filename),
      nombreArchivo: req.file.originalname,
    });
    res.status(201).json(adjunto);
  }),

  panelIva: asyncHandler(async (req: Request, res: Response) => {
    res.json(await ivaService.panel(requireTenant(req), req.query as never));
  }),

  exportarIva: asyncHandler(async (req: Request, res: Response) => {
    const tenantId = requireTenant(req);
    const query = req.query as unknown as ExportarIvaQuery;
    const panel = await ivaService.panel(tenantId, query);

    if (query.formato === 'excel') {
      await exportarIvaExcel(res, panel, query.desde, query.hasta);
    } else {
      exportarIvaPdf(res, panel, query.desde, query.hasta);
    }
  }),
};
