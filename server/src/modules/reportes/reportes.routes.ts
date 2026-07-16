import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { reportesController } from './reportes.controller';
import { exportarReporteQuerySchema, reporteParamsSchema, reporteQuerySchema } from './reportes.validation';

export const reportesRouter = Router();
reportesRouter.use(authMiddleware, tenantMiddleware);

/**
 * @openapi
 * /reportes/{tipo}:
 *   get:
 *     tags: [Reportes]
 *     summary: Generar un reporte (produccion, costos, rentabilidad, cultivos, campos, quimicos, proveedores, clientes, facturacion, iva, caja, tareas)
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema: { type: string, enum: [produccion, costos, rentabilidad, cultivos, campos, quimicos, proveedores, clientes, facturacion, iva, caja, tareas] }
 *       - in: query
 *         name: desde
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: hasta
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Datos tabulares del reporte (columnas + filas) }
 */
reportesRouter.get('/:tipo', validate({ params: reporteParamsSchema, query: reporteQuerySchema }), reportesController.generar);

/**
 * @openapi
 * /reportes/{tipo}/exportar:
 *   get:
 *     tags: [Reportes]
 *     summary: Exportar un reporte en CSV, Excel o PDF
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: formato
 *         required: true
 *         schema: { type: string, enum: [csv, excel, pdf] }
 *       - in: query
 *         name: desde
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: hasta
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Archivo generado }
 */
reportesRouter.get(
  '/:tipo/exportar',
  validate({ params: reporteParamsSchema, query: exportarReporteQuerySchema }),
  reportesController.exportar,
);
