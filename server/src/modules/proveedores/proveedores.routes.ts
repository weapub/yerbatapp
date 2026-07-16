import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbac } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { proveedoresController } from './proveedores.controller';
import {
  createProductoSchema,
  createProveedorSchema,
  listProveedoresQuerySchema,
  movimientoCCProveedorSchema,
  proveedorIdParamSchema,
  updateProveedorSchema,
} from './proveedores.validation';

export const proveedoresRouter = Router();
proveedoresRouter.use(authMiddleware, tenantMiddleware);

/**
 * @openapi
 * /proveedores:
 *   get:
 *     tags: [Proveedores]
 *     summary: Listar proveedores de insumos (paginado, búsqueda)
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
 *       200: { description: Listado paginado de proveedores }
 *   post:
 *     tags: [Proveedores]
 *     summary: Crear un proveedor (ADMIN/SUPERVISOR)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [empresa, cuit]
 *             properties:
 *               empresa: { type: string }
 *               cuit: { type: string }
 *               direccion: { type: string }
 *               telefono: { type: string }
 *               email: { type: string }
 *     responses:
 *       201: { description: Proveedor creado }
 */
proveedoresRouter.get('/', validate({ query: listProveedoresQuerySchema }), proveedoresController.list);
proveedoresRouter.post(
  '/',
  rbac(RolUsuario.ADMIN, RolUsuario.SUPERVISOR),
  validate({ body: createProveedorSchema }),
  proveedoresController.create,
);

/**
 * @openapi
 * /proveedores/{id}:
 *   get:
 *     tags: [Proveedores]
 *     summary: Obtener un proveedor con sus productos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Proveedor encontrado }
 *   patch:
 *     tags: [Proveedores]
 *     summary: Actualizar un proveedor (ADMIN/SUPERVISOR)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Proveedor actualizado }
 *   delete:
 *     tags: [Proveedores]
 *     summary: Eliminar un proveedor (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Proveedor eliminado }
 */
proveedoresRouter.get('/:id', validate({ params: proveedorIdParamSchema }), proveedoresController.getById);
proveedoresRouter.patch(
  '/:id',
  rbac(RolUsuario.ADMIN, RolUsuario.SUPERVISOR),
  validate({ params: proveedorIdParamSchema, body: updateProveedorSchema }),
  proveedoresController.update,
);
proveedoresRouter.delete(
  '/:id',
  rbac(RolUsuario.ADMIN),
  validate({ params: proveedorIdParamSchema }),
  proveedoresController.delete,
);

/**
 * @openapi
 * /proveedores/{id}/productos:
 *   post:
 *     tags: [Proveedores]
 *     summary: Agregar un producto vendido por el proveedor (ADMIN/SUPERVISOR)
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
 *             required: [nombre, tipo]
 *             properties:
 *               nombre: { type: string }
 *               marca: { type: string }
 *               tipo: { type: string, enum: [FERTILIZANTE, HERBICIDA] }
 *     responses:
 *       201: { description: Producto creado }
 */
proveedoresRouter.post(
  '/:id/productos',
  rbac(RolUsuario.ADMIN, RolUsuario.SUPERVISOR),
  validate({ params: proveedorIdParamSchema, body: createProductoSchema }),
  proveedoresController.createProducto,
);

/**
 * @openapi
 * /proveedores/{id}/historial:
 *   get:
 *     tags: [Proveedores]
 *     summary: Historial de aplicaciones (compras/usos) de productos de este proveedor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Historial de aplicaciones }
 */
proveedoresRouter.get(
  '/:id/historial',
  validate({ params: proveedorIdParamSchema }),
  proveedoresController.historialAplicaciones,
);

/**
 * @openapi
 * /proveedores/{id}/cuenta-corriente:
 *   get:
 *     tags: [Proveedores]
 *     summary: Historial de cuenta corriente del proveedor (compras y pagos, con saldo)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Movimientos de cuenta corriente }
 *   post:
 *     tags: [Proveedores]
 *     summary: Registrar una compra o un pago en la cuenta corriente (ADMIN/SUPERVISOR)
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
 *               tipo: { type: string, enum: [COMPRA, PAGO] }
 *               monto: { type: number }
 *               fecha: { type: string, format: date }
 *               descripcion: { type: string }
 *     responses:
 *       201: { description: Movimiento registrado, incluye el saldo actualizado }
 */
proveedoresRouter.get(
  '/:id/cuenta-corriente',
  validate({ params: proveedorIdParamSchema }),
  proveedoresController.listMovimientosCC,
);
proveedoresRouter.post(
  '/:id/cuenta-corriente',
  rbac(RolUsuario.ADMIN, RolUsuario.SUPERVISOR),
  validate({ params: proveedorIdParamSchema, body: movimientoCCProveedorSchema }),
  proveedoresController.registrarMovimientoCC,
);
