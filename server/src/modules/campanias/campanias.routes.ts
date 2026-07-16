import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbac } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { campaniasController } from './campanias.controller';
import { campaniaIdParamSchema, createCampaniaSchema, updateCampaniaSchema } from './campanias.validation';

export const campaniasRouter = Router();
campaniasRouter.use(authMiddleware, tenantMiddleware);

/**
 * @openapi
 * /campanias:
 *   get:
 *     tags: [Campañas]
 *     summary: Listar campañas del tenant
 *     responses:
 *       200: { description: Listado de campañas }
 *   post:
 *     tags: [Campañas]
 *     summary: Crear una campaña (ADMIN/SUPERVISOR)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, fechaInicio, fechaFin]
 *             properties:
 *               nombre: { type: string, example: "2025/2026" }
 *               fechaInicio: { type: string, format: date }
 *               fechaFin: { type: string, format: date }
 *     responses:
 *       201: { description: Campaña creada }
 */
campaniasRouter.get('/', campaniasController.list);
campaniasRouter.post(
  '/',
  rbac(RolUsuario.ADMIN, RolUsuario.SUPERVISOR),
  validate({ body: createCampaniaSchema }),
  campaniasController.create,
);

/**
 * @openapi
 * /campanias/{id}:
 *   patch:
 *     tags: [Campañas]
 *     summary: Actualizar una campaña (ADMIN/SUPERVISOR)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Campaña actualizada }
 *   delete:
 *     tags: [Campañas]
 *     summary: Eliminar una campaña (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Campaña eliminada }
 */
campaniasRouter.patch(
  '/:id',
  rbac(RolUsuario.ADMIN, RolUsuario.SUPERVISOR),
  validate({ params: campaniaIdParamSchema, body: updateCampaniaSchema }),
  campaniasController.update,
);
campaniasRouter.delete(
  '/:id',
  rbac(RolUsuario.ADMIN),
  validate({ params: campaniaIdParamSchema }),
  campaniasController.delete,
);
