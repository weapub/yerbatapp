import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbac } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { backupsController } from './backups.controller';
import { backupIdParamSchema, restaurarBackupSchema } from './backups.validation';

export const backupsRouter = Router();
backupsRouter.use(authMiddleware, tenantMiddleware, rbac(RolUsuario.ADMIN));

/**
 * @openapi
 * /backups:
 *   get:
 *     tags: [Backups]
 *     summary: Listar historial de backups (solo ADMIN)
 *     responses:
 *       200: { description: Listado de backups }
 *   post:
 *     tags: [Backups]
 *     summary: Generar un backup manual (solo ADMIN)
 *     responses:
 *       201: { description: Backup generado }
 */
backupsRouter.get('/', backupsController.list);
backupsRouter.post('/', backupsController.crear);

/**
 * @openapi
 * /backups/{id}/descargar:
 *   get:
 *     tags: [Backups]
 *     summary: Descargar el archivo .sql de un backup (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Archivo .sql }
 */
backupsRouter.get('/:id/descargar', validate({ params: backupIdParamSchema }), backupsController.descargar);

/**
 * @openapi
 * /backups/{id}/restaurar:
 *   post:
 *     tags: [Backups]
 *     summary: "DESTRUCTIVO: restaura la base de datos completa desde este backup (solo ADMIN)"
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
 *             required: [confirmar]
 *             properties:
 *               confirmar: { type: string, enum: [RESTAURAR], description: 'Debe enviarse literalmente "RESTAURAR"' }
 *     responses:
 *       200: { description: Base de datos restaurada }
 */
backupsRouter.post(
  '/:id/restaurar',
  validate({ params: backupIdParamSchema, body: restaurarBackupSchema }),
  backupsController.restaurar,
);
