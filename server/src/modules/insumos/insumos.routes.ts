import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbac } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { insumosController } from './insumos.controller';
import {
  aplicacionIdParamSchema,
  createAplicacionSchema,
  estadisticasQuerySchema,
  listAplicacionesQuerySchema,
  updateAplicacionSchema,
} from './insumos.validation';

export const insumosRouter = Router();
insumosRouter.use(authMiddleware, tenantMiddleware);

/**
 * @openapi
 * /insumos/estadisticas:
 *   get:
 *     tags: [Insumos]
 *     summary: Estadísticas automáticas de aplicaciones (fertilizantes u herbicidas)
 *     parameters:
 *       - in: query
 *         name: tipo
 *         required: true
 *         schema: { type: string, enum: [FERTILIZANTE, HERBICIDA] }
 *       - in: query
 *         name: campoId
 *         schema: { type: string }
 *       - in: query
 *         name: cultivoId
 *         schema: { type: string }
 *     responses:
 *       200: { description: Promedios por hectárea/cultivo/año y costos }
 */
insumosRouter.get('/estadisticas', validate({ query: estadisticasQuerySchema }), insumosController.estadisticas);

/**
 * @openapi
 * /insumos:
 *   get:
 *     tags: [Insumos]
 *     summary: Listar aplicaciones de fertilizantes/herbicidas (paginado, filtrable)
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema: { type: string, enum: [FERTILIZANTE, HERBICIDA] }
 *       - in: query
 *         name: campoId
 *         schema: { type: string }
 *       - in: query
 *         name: cultivoId
 *         schema: { type: string }
 *       - in: query
 *         name: proveedorId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Listado paginado de aplicaciones }
 *   post:
 *     tags: [Insumos]
 *     summary: Registrar una aplicación de fertilizante/herbicida (ADMIN/SUPERVISOR). El tipo se toma del producto elegido.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [campoId, cultivoId, productoId, proveedorId, fecha, dosisHa, cantidadUtilizada, aplicadorId]
 *             properties:
 *               campoId: { type: string }
 *               cultivoId: { type: string }
 *               productoId: { type: string }
 *               proveedorId: { type: string }
 *               fecha: { type: string, format: date }
 *               dosisHa: { type: number }
 *               cantidadUtilizada: { type: number }
 *               costo: { type: number }
 *               aplicadorId: { type: string }
 *               observaciones: { type: string }
 *     responses:
 *       201: { description: Aplicación registrada }
 */
insumosRouter.get('/', validate({ query: listAplicacionesQuerySchema }), insumosController.list);
insumosRouter.post(
  '/',
  rbac(RolUsuario.ADMIN, RolUsuario.SUPERVISOR),
  validate({ body: createAplicacionSchema }),
  insumosController.create,
);

/**
 * @openapi
 * /insumos/{id}:
 *   get:
 *     tags: [Insumos]
 *     summary: Obtener una aplicación por id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Aplicación encontrada }
 *   patch:
 *     tags: [Insumos]
 *     summary: Actualizar una aplicación (ADMIN/SUPERVISOR)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Aplicación actualizada }
 *   delete:
 *     tags: [Insumos]
 *     summary: Eliminar una aplicación (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Aplicación eliminada }
 */
insumosRouter.get('/:id', validate({ params: aplicacionIdParamSchema }), insumosController.getById);
insumosRouter.patch(
  '/:id',
  rbac(RolUsuario.ADMIN, RolUsuario.SUPERVISOR),
  validate({ params: aplicacionIdParamSchema, body: updateAplicacionSchema }),
  insumosController.update,
);
insumosRouter.delete(
  '/:id',
  rbac(RolUsuario.ADMIN),
  validate({ params: aplicacionIdParamSchema }),
  insumosController.delete,
);
