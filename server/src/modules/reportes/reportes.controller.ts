import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/errors/AppError';
import { exportReport } from '../../shared/utils/exporters';
import { reportesService } from './reportes.service';
import { ExportarReporteQuery, ReporteQuery, TipoReporte } from './reportes.validation';

const requireTenant = (req: Request) => {
  if (!req.tenantId) throw AppError.unauthorized();
  return req.tenantId;
};

export const reportesController = {
  generar: asyncHandler(async (req: Request, res: Response) => {
    const tipo = req.params.tipo as TipoReporte;
    const query = req.query as unknown as ReporteQuery;
    res.json(await reportesService.generar(requireTenant(req), tipo, query));
  }),

  exportar: asyncHandler(async (req: Request, res: Response) => {
    const tipo = req.params.tipo as TipoReporte;
    const query = req.query as unknown as ExportarReporteQuery;
    const { titulo, columns, rows } = await reportesService.generar(requireTenant(req), tipo, query);
    const filename = `${tipo}_${new Date().toISOString().slice(0, 10)}`;
    await exportReport(res, query.formato, columns, rows, filename, titulo);
  }),
};
