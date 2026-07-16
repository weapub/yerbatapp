import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbac } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { uploader } from '../../shared/utils/upload';
import { facturasController } from './facturas.controller';
import {
  createFacturaSchema,
  exportarIvaQuerySchema,
  facturaIdParamSchema,
  listFacturasQuerySchema,
  panelIvaQuerySchema,
  updateFacturaSchema,
} from './facturas.validation';

export const facturasRouter = Router();
facturasRouter.use(authMiddleware, tenantMiddleware);

const gestor = rbac(RolUsuario.ADMIN, RolUsuario.SUPERVISOR);
const adjuntoUpload = uploader('facturas');

/**
 * @openapi
 * /facturas/iva:
 *   get:
 *     tags: [Facturas]
 *     summary: Panel impositivo de IVA (Ventas/Compras/Débito/Crédito/Saldo técnico, por mes)
 *     parameters:
 *       - in: query
 *         name: desde
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: hasta
 *         required: true
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Totales de IVA por mes y acumulado del período }
 */
facturasRouter.get('/iva', validate({ query: panelIvaQuerySchema }), facturasController.panelIva);

/**
 * @openapi
 * /facturas/iva/exportar:
 *   get:
 *     tags: [Facturas]
 *     summary: Exportar el panel de IVA en Excel o PDF
 *     parameters:
 *       - in: query
 *         name: desde
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: hasta
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: formato
 *         required: true
 *         schema: { type: string, enum: [excel, pdf] }
 *     responses:
 *       200: { description: Archivo generado (xlsx o pdf) }
 */
facturasRouter.get('/iva/exportar', validate({ query: exportarIvaQuerySchema }), facturasController.exportarIva);

/**
 * @openapi
 * /facturas:
 *   get:
 *     tags: [Facturas]
 *     summary: Listar facturas (paginado, filtrable por operación/estado/tipo/cliente/proveedor/fechas)
 *     parameters:
 *       - in: query
 *         name: operacion
 *         schema: { type: string, enum: [VENTA, COMPRA] }
 *       - in: query
 *         name: estado
 *         schema: { type: string, enum: [PENDIENTE, PAGADA, VENCIDA, ANULADA] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Listado paginado de facturas }
 *   post:
 *     tags: [Facturas]
 *     summary: Registrar una factura (ADMIN/SUPERVISOR). Genera automáticamente el movimiento de cuenta corriente del cliente/proveedor.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tipo, operacion, numero, fecha, importeNeto, iva]
 *             properties:
 *               tipo: { type: string, enum: [A, B, C] }
 *               operacion: { type: string, enum: [VENTA, COMPRA] }
 *               numero: { type: string }
 *               clienteId: { type: string }
 *               proveedorId: { type: string }
 *               fecha: { type: string, format: date }
 *               cae: { type: string }
 *               importeNeto: { type: number }
 *               iva: { type: number }
 *     responses:
 *       201: { description: Factura creada (total = importeNeto + iva, calculado automáticamente) }
 */
facturasRouter.get('/', validate({ query: listFacturasQuerySchema }), facturasController.list);
facturasRouter.post('/', gestor, validate({ body: createFacturaSchema }), facturasController.create);

/**
 * @openapi
 * /facturas/{id}:
 *   get:
 *     tags: [Facturas]
 *     summary: Obtener una factura por id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Factura encontrada }
 *   patch:
 *     tags: [Facturas]
 *     summary: Actualizar estado o CAE de una factura (ADMIN/SUPERVISOR)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Factura actualizada }
 *   delete:
 *     tags: [Facturas]
 *     summary: Eliminar una factura (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Factura eliminada }
 */
facturasRouter.get('/:id', validate({ params: facturaIdParamSchema }), facturasController.getById);
facturasRouter.patch(
  '/:id',
  gestor,
  validate({ params: facturaIdParamSchema, body: updateFacturaSchema }),
  facturasController.update,
);
facturasRouter.delete(
  '/:id',
  rbac(RolUsuario.ADMIN),
  validate({ params: facturaIdParamSchema }),
  facturasController.delete,
);

/**
 * @openapi
 * /facturas/{id}/adjuntos:
 *   post:
 *     tags: [Facturas]
 *     summary: Adjuntar PDF o imagen a una factura (multipart/form-data, campo "file")
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201: { description: Adjunto creado }
 */
facturasRouter.post(
  '/:id/adjuntos',
  validate({ params: facturaIdParamSchema }),
  adjuntoUpload.single('file'),
  facturasController.addAdjunto,
);
