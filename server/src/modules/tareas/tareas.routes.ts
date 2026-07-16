import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbac } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { uploader } from '../../shared/utils/upload';
import { tareasController } from './tareas.controller';
import {
  calendarioQuerySchema,
  createTareaSchema,
  listTareasQuerySchema,
  tareaIdParamSchema,
  updateTareaSchema,
} from './tareas.validation';

export const tareasRouter = Router();
tareasRouter.use(authMiddleware, tenantMiddleware);

const adjuntoUpload = uploader('tareas');

/**
 * @openapi
 * /tareas/calendario:
 *   get:
 *     tags: [Tareas]
 *     summary: Tareas programadas dentro de un rango de fechas (vista calendario)
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
 *       200: { description: Tareas en el rango, con semáforo calculado }
 */
tareasRouter.get('/calendario', validate({ query: calendarioQuerySchema }), tareasController.calendario);

/**
 * @openapi
 * /tareas:
 *   get:
 *     tags: [Tareas]
 *     summary: Listar tareas (filtrable por campo/cultivo/responsable/estado/prioridad/tipo/semáforo, paginado)
 *     parameters:
 *       - in: query
 *         name: campoId
 *         schema: { type: string }
 *       - in: query
 *         name: cultivoId
 *         schema: { type: string }
 *       - in: query
 *         name: responsableId
 *         schema: { type: string }
 *       - in: query
 *         name: estado
 *         schema: { type: string, enum: [PENDIENTE, EN_PROGRESO, COMPLETADA, CANCELADA] }
 *       - in: query
 *         name: prioridad
 *         schema: { type: string, enum: [BAJA, MEDIA, ALTA, URGENTE] }
 *       - in: query
 *         name: tipo
 *         schema: { type: string }
 *       - in: query
 *         name: semaforo
 *         schema: { type: string, enum: [ROJO, AMARILLO, VERDE] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Listado paginado de tareas }
 *   post:
 *     tags: [Tareas]
 *     summary: Crear una tarea agrícola (ADMIN/SUPERVISOR)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tipo, campoId, responsableId, fechaProgramada]
 *             properties:
 *               tipo: { type: string }
 *               campoId: { type: string }
 *               cultivoId: { type: string }
 *               responsableId: { type: string }
 *               fechaProgramada: { type: string, format: date }
 *               prioridad: { type: string, enum: [BAJA, MEDIA, ALTA, URGENTE] }
 *               observaciones: { type: string }
 *     responses:
 *       201: { description: Tarea creada }
 */
tareasRouter.get('/', validate({ query: listTareasQuerySchema }), tareasController.list);
tareasRouter.post(
  '/',
  rbac(RolUsuario.ADMIN, RolUsuario.SUPERVISOR),
  validate({ body: createTareaSchema }),
  tareasController.create,
);

/**
 * @openapi
 * /tareas/{id}:
 *   get:
 *     tags: [Tareas]
 *     summary: Obtener una tarea por id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Tarea encontrada }
 *   patch:
 *     tags: [Tareas]
 *     summary: Actualizar una tarea — cualquier usuario autenticado puede marcarla como realizada/estado; el resto de campos requiere ADMIN/SUPERVISOR
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Tarea actualizada }
 *   delete:
 *     tags: [Tareas]
 *     summary: Eliminar una tarea (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Tarea eliminada }
 */
tareasRouter.get('/:id', validate({ params: tareaIdParamSchema }), tareasController.getById);
tareasRouter.patch(
  '/:id',
  validate({ params: tareaIdParamSchema, body: updateTareaSchema }),
  tareasController.update,
);
tareasRouter.delete(
  '/:id',
  rbac(RolUsuario.ADMIN),
  validate({ params: tareaIdParamSchema }),
  tareasController.delete,
);

/**
 * @openapi
 * /tareas/{id}/adjuntos:
 *   post:
 *     tags: [Tareas]
 *     summary: Adjuntar un archivo a una tarea (multipart/form-data, campo "file")
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
tareasRouter.post(
  '/:id/adjuntos',
  validate({ params: tareaIdParamSchema }),
  adjuntoUpload.single('file'),
  tareasController.addAdjunto,
);
