import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbac } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { notificacionesController } from './notificaciones.controller';
import { listNotificacionesQuerySchema, notificacionIdParamSchema } from './notificaciones.validation';

export const notificacionesRouter = Router();
notificacionesRouter.use(authMiddleware, tenantMiddleware);

/**
 * @openapi
 * /notificaciones:
 *   get:
 *     tags: [Notificaciones]
 *     summary: Listar notificaciones del usuario autenticado
 *     parameters:
 *       - in: query
 *         name: leida
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Listado paginado de notificaciones }
 */
notificacionesRouter.get('/', validate({ query: listNotificacionesQuerySchema }), notificacionesController.list);

/**
 * @openapi
 * /notificaciones/no-leidas:
 *   get:
 *     tags: [Notificaciones]
 *     summary: Cantidad de notificaciones no leídas del usuario autenticado
 *     responses:
 *       200: { description: Contador de no leídas }
 */
notificacionesRouter.get('/no-leidas', notificacionesController.countNoLeidas);

/**
 * @openapi
 * /notificaciones/marcar-todas-leidas:
 *   patch:
 *     tags: [Notificaciones]
 *     summary: Marcar todas las notificaciones del usuario como leídas
 *     responses:
 *       204: { description: Notificaciones actualizadas }
 */
notificacionesRouter.patch('/marcar-todas-leidas', notificacionesController.marcarTodasLeidas);

/**
 * @openapi
 * /notificaciones/generar-alertas:
 *   post:
 *     tags: [Notificaciones]
 *     summary: Disparar manualmente la generación de alertas automáticas (ADMIN). También corre solo por cron.
 *     responses:
 *       200: { description: Cantidad de notificaciones generadas }
 */
notificacionesRouter.post('/generar-alertas', rbac(RolUsuario.ADMIN), notificacionesController.generarAlertas);

/**
 * @openapi
 * /notificaciones/{id}/leida:
 *   patch:
 *     tags: [Notificaciones]
 *     summary: Marcar una notificación como leída
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Notificación actualizada }
 */
notificacionesRouter.patch(
  '/:id/leida',
  validate({ params: notificacionIdParamSchema }),
  notificacionesController.marcarLeida,
);
