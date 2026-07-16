import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbac } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { rendimientosController } from './rendimientos.controller';
import {
  comparativaQuerySchema,
  createRendimientoSchema,
  listRendimientosQuerySchema,
  rendimientoIdParamSchema,
  updateRendimientoSchema,
} from './rendimientos.validation';

export const rendimientosRouter = Router();
rendimientosRouter.use(authMiddleware, tenantMiddleware);

/**
 * @openapi
 * /rendimientos/comparativa:
 *   get:
 *     tags: [Rendimientos]
 *     summary: Comparativa agregada (por campo, cultivo o campaña)
 *     parameters:
 *       - in: query
 *         name: groupBy
 *         schema: { type: string, enum: [campo, cultivo, campania], default: campania }
 *       - in: query
 *         name: campaniaId
 *         schema: { type: string }
 *       - in: query
 *         name: campoId
 *         schema: { type: string }
 *       - in: query
 *         name: cultivoId
 *         schema: { type: string }
 *     responses:
 *       200: { description: Totales de producción/costo/ingreso/rentabilidad agrupados }
 */
rendimientosRouter.get(
  '/comparativa',
  validate({ query: comparativaQuerySchema }),
  rendimientosController.comparativa,
);

/**
 * @openapi
 * /rendimientos:
 *   get:
 *     tags: [Rendimientos]
 *     summary: Listar rendimientos (filtrable por campo/cultivo/campaña, paginado)
 *     parameters:
 *       - in: query
 *         name: campoId
 *         schema: { type: string }
 *       - in: query
 *         name: cultivoId
 *         schema: { type: string }
 *       - in: query
 *         name: campaniaId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Listado paginado de rendimientos }
 *   post:
 *     tags: [Rendimientos]
 *     summary: Registrar un rendimiento de campaña (ADMIN/SUPERVISOR). El rendimiento por hectárea se calcula automáticamente.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [campoId, cultivoId, campaniaId, fecha, produccion]
 *             properties:
 *               campoId: { type: string }
 *               cultivoId: { type: string }
 *               campaniaId: { type: string }
 *               fecha: { type: string, format: date }
 *               produccion: { type: number }
 *               unidad: { type: string, enum: [KG, TONELADA] }
 *               costo: { type: number }
 *               ingreso: { type: number }
 *     responses:
 *       201: { description: Rendimiento registrado }
 */
rendimientosRouter.get('/', validate({ query: listRendimientosQuerySchema }), rendimientosController.list);
rendimientosRouter.post(
  '/',
  rbac(RolUsuario.ADMIN, RolUsuario.SUPERVISOR),
  validate({ body: createRendimientoSchema }),
  rendimientosController.create,
);

/**
 * @openapi
 * /rendimientos/{id}:
 *   get:
 *     tags: [Rendimientos]
 *     summary: Obtener un rendimiento por id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Rendimiento encontrado }
 *       404: { description: No encontrado }
 *   patch:
 *     tags: [Rendimientos]
 *     summary: Actualizar un rendimiento (ADMIN/SUPERVISOR)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Rendimiento actualizado }
 *   delete:
 *     tags: [Rendimientos]
 *     summary: Eliminar un rendimiento (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Rendimiento eliminado }
 */
rendimientosRouter.get('/:id', validate({ params: rendimientoIdParamSchema }), rendimientosController.getById);
rendimientosRouter.patch(
  '/:id',
  rbac(RolUsuario.ADMIN, RolUsuario.SUPERVISOR),
  validate({ params: rendimientoIdParamSchema, body: updateRendimientoSchema }),
  rendimientosController.update,
);
rendimientosRouter.delete(
  '/:id',
  rbac(RolUsuario.ADMIN),
  validate({ params: rendimientoIdParamSchema }),
  rendimientosController.delete,
);
