import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbac } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { usersController } from './users.controller';
import { createUserSchema, updateUserSchema, userIdParamSchema } from './users.validation';

export const usersRouter = Router();
usersRouter.use(authMiddleware, tenantMiddleware);

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Listar usuarios del tenant
 *     responses:
 *       200: { description: Listado de usuarios }
 */
usersRouter.get('/', usersController.list);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Obtener un usuario por id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Usuario encontrado }
 *       404: { description: No encontrado }
 */
usersRouter.get('/:id', validate({ params: userIdParamSchema }), usersController.getById);

/**
 * @openapi
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Crear un usuario (solo ADMIN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, password]
 *             properties:
 *               nombre: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               rol: { type: string, enum: [ADMIN, SUPERVISOR, EMPLEADO] }
 *     responses:
 *       201: { description: Usuario creado }
 *       409: { description: Email ya registrado }
 */
usersRouter.post('/', rbac(RolUsuario.ADMIN), validate({ body: createUserSchema }), usersController.create);

/**
 * @openapi
 * /users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Actualizar datos, rol o estado de un usuario (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre: { type: string }
 *               rol: { type: string, enum: [ADMIN, SUPERVISOR, EMPLEADO] }
 *               activo: { type: boolean }
 *     responses:
 *       200: { description: Usuario actualizado }
 */
usersRouter.patch(
  '/:id',
  rbac(RolUsuario.ADMIN),
  validate({ params: userIdParamSchema, body: updateUserSchema }),
  usersController.update,
);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Desactivar un usuario (baja lógica, solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Usuario desactivado }
 */
usersRouter.delete(
  '/:id',
  rbac(RolUsuario.ADMIN),
  validate({ params: userIdParamSchema }),
  usersController.deactivate,
);
