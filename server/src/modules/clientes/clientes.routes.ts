import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbac } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { clientesController } from './clientes.controller';
import {
  clienteIdParamSchema,
  createClienteSchema,
  listClientesQuerySchema,
  movimientoCCClienteSchema,
  updateClienteSchema,
} from './clientes.validation';

export const clientesRouter = Router();
clientesRouter.use(authMiddleware, tenantMiddleware);

const gestor = rbac(RolUsuario.ADMIN, RolUsuario.SUPERVISOR);

/**
 * @openapi
 * /clientes:
 *   get:
 *     tags: [Clientes]
 *     summary: Listar clientes (paginado, búsqueda, incluye saldo de cuenta corriente y total de ventas)
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Listado paginado de clientes }
 *   post:
 *     tags: [Clientes]
 *     summary: Crear un cliente (ADMIN/SUPERVISOR)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razonSocial, cuit]
 *             properties:
 *               razonSocial: { type: string }
 *               cuit: { type: string }
 *               contacto: { type: string }
 *               email: { type: string }
 *               telefono: { type: string }
 *               direccion: { type: string }
 *     responses:
 *       201: { description: Cliente creado }
 */
clientesRouter.get('/', validate({ query: listClientesQuerySchema }), clientesController.list);
clientesRouter.post('/', gestor, validate({ body: createClienteSchema }), clientesController.create);

/**
 * @openapi
 * /clientes/{id}:
 *   get:
 *     tags: [Clientes]
 *     summary: Obtener un cliente por id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Cliente encontrado }
 *   patch:
 *     tags: [Clientes]
 *     summary: Actualizar un cliente (ADMIN/SUPERVISOR)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Cliente actualizado }
 *   delete:
 *     tags: [Clientes]
 *     summary: Eliminar un cliente (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Cliente eliminado }
 */
clientesRouter.get('/:id', validate({ params: clienteIdParamSchema }), clientesController.getById);
clientesRouter.patch(
  '/:id',
  gestor,
  validate({ params: clienteIdParamSchema, body: updateClienteSchema }),
  clientesController.update,
);
clientesRouter.delete(
  '/:id',
  rbac(RolUsuario.ADMIN),
  validate({ params: clienteIdParamSchema }),
  clientesController.delete,
);

/**
 * @openapi
 * /clientes/{id}/cuenta-corriente:
 *   get:
 *     tags: [Clientes]
 *     summary: Historial de cuenta corriente del cliente (ventas y cobros, con saldo)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Movimientos de cuenta corriente }
 *   post:
 *     tags: [Clientes]
 *     summary: Registrar una venta o un cobro en la cuenta corriente (ADMIN/SUPERVISOR)
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
 *             required: [tipo, monto]
 *             properties:
 *               tipo: { type: string, enum: [VENTA, COBRO] }
 *               monto: { type: number }
 *               fecha: { type: string, format: date }
 *               descripcion: { type: string }
 *     responses:
 *       201: { description: Movimiento registrado, incluye el saldo actualizado }
 */
clientesRouter.get(
  '/:id/cuenta-corriente',
  validate({ params: clienteIdParamSchema }),
  clientesController.listMovimientosCC,
);
clientesRouter.post(
  '/:id/cuenta-corriente',
  gestor,
  validate({ params: clienteIdParamSchema, body: movimientoCCClienteSchema }),
  clientesController.registrarMovimientoCC,
);
