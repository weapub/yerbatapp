import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbac } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { cultivosController } from './cultivos.controller';
import {
  createCultivoSchema,
  createHistorialSchema,
  cultivoIdParamSchema,
  listCultivosQuerySchema,
  updateCultivoSchema,
} from './cultivos.validation';

export const cultivosRouter = Router();
cultivosRouter.use(authMiddleware, tenantMiddleware);

/**
 * @openapi
 * /cultivos:
 *   get:
 *     tags: [Cultivos]
 *     summary: Listar cultivos (filtrable por campoId/estadoSanitario, paginado)
 *     parameters:
 *       - in: query
 *         name: campoId
 *         schema: { type: string }
 *       - in: query
 *         name: estadoSanitario
 *         schema: { type: string, enum: [EXCELENTE, BUENO, REGULAR, MALO] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Listado paginado de cultivos }
 */
cultivosRouter.get('/', validate({ query: listCultivosQuerySchema }), cultivosController.list);

/**
 * @openapi
 * /cultivos/{id}:
 *   get:
 *     tags: [Cultivos]
 *     summary: Obtener un cultivo con su historial
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Cultivo encontrado }
 *       404: { description: No encontrado }
 */
cultivosRouter.get('/:id', validate({ params: cultivoIdParamSchema }), cultivosController.getById);

/**
 * @openapi
 * /cultivos:
 *   post:
 *     tags: [Cultivos]
 *     summary: Crear un cultivo dentro de un campo (ADMIN/SUPERVISOR)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [campoId, nombre, fechaPlantacion, cantidadPlantas]
 *             properties:
 *               campoId: { type: string }
 *               nombre: { type: string, example: "Yerba Mate" }
 *               variedad: { type: string }
 *               fechaPlantacion: { type: string, format: date }
 *               cantidadPlantas: { type: integer }
 *               estadoSanitario: { type: string, enum: [EXCELENTE, BUENO, REGULAR, MALO] }
 *               produccionEsperadaKg: { type: number }
 *     responses:
 *       201: { description: Cultivo creado }
 */
cultivosRouter.post(
  '/',
  rbac(RolUsuario.ADMIN, RolUsuario.SUPERVISOR),
  validate({ body: createCultivoSchema }),
  cultivosController.create,
);

/**
 * @openapi
 * /cultivos/{id}:
 *   patch:
 *     tags: [Cultivos]
 *     summary: Actualizar un cultivo (ADMIN/SUPERVISOR)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Cultivo actualizado }
 */
cultivosRouter.patch(
  '/:id',
  rbac(RolUsuario.ADMIN, RolUsuario.SUPERVISOR),
  validate({ params: cultivoIdParamSchema, body: updateCultivoSchema }),
  cultivosController.update,
);

/**
 * @openapi
 * /cultivos/{id}:
 *   delete:
 *     tags: [Cultivos]
 *     summary: Eliminar un cultivo (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Cultivo eliminado }
 */
cultivosRouter.delete(
  '/:id',
  rbac(RolUsuario.ADMIN),
  validate({ params: cultivoIdParamSchema }),
  cultivosController.delete,
);

/**
 * @openapi
 * /cultivos/{id}/historial:
 *   post:
 *     tags: [Cultivos]
 *     summary: Registrar un evento en el historial del cultivo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [evento]
 *             properties:
 *               evento: { type: string }
 *               detalle: { type: string }
 *     responses:
 *       201: { description: Evento registrado }
 */
cultivosRouter.post(
  '/:id/historial',
  validate({ params: cultivoIdParamSchema, body: createHistorialSchema }),
  cultivosController.addHistorial,
);
