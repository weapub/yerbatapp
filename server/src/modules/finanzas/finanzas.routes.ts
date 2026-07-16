import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbac } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { uploader } from '../../shared/utils/upload';
import { categoriasController, centrosCostoController, cuentasController } from './lookups.controller';
import { movimientosController } from './movimientos.controller';
import { reportesController } from './reportes.controller';
import {
  categoriaIdParamSchema,
  centroCostoIdParamSchema,
  createCategoriaSchema,
  createCentroCostoSchema,
  createCuentaSchema,
  createMovimientoSchema,
  cuentaIdParamSchema,
  flujoCajaQuerySchema,
  listMovimientosQuerySchema,
  movimientoIdParamSchema,
  rangoFechasQuerySchema,
  updateCategoriaSchema,
  updateCentroCostoSchema,
  updateCuentaSchema,
  updateMovimientoSchema,
} from './finanzas.validation';

export const finanzasRouter = Router();
finanzasRouter.use(authMiddleware, tenantMiddleware);

const gestor = rbac(RolUsuario.ADMIN, RolUsuario.SUPERVISOR);
const adjuntoUpload = uploader('finanzas');

/**
 * @openapi
 * /finanzas/cuentas:
 *   get:
 *     tags: [Finanzas]
 *     summary: Listar cuentas (caja/bancos) con saldo actual calculado
 *     responses:
 *       200: { description: Listado de cuentas }
 *   post:
 *     tags: [Finanzas]
 *     summary: Crear una cuenta (ADMIN/SUPERVISOR)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, tipo]
 *             properties:
 *               nombre: { type: string }
 *               tipo: { type: string, enum: [CAJA, BANCO] }
 *               saldoInicial: { type: number }
 *     responses:
 *       201: { description: Cuenta creada }
 */
finanzasRouter.get('/cuentas', cuentasController.list);
finanzasRouter.post('/cuentas', gestor, validate({ body: createCuentaSchema }), cuentasController.create);
finanzasRouter.patch(
  '/cuentas/:id',
  gestor,
  validate({ params: cuentaIdParamSchema, body: updateCuentaSchema }),
  cuentasController.update,
);
finanzasRouter.delete(
  '/cuentas/:id',
  rbac(RolUsuario.ADMIN),
  validate({ params: cuentaIdParamSchema }),
  cuentasController.delete,
);

/**
 * @openapi
 * /finanzas/categorias:
 *   get:
 *     tags: [Finanzas]
 *     summary: Listar categorías de ingresos/egresos
 *     responses:
 *       200: { description: Listado de categorías }
 *   post:
 *     tags: [Finanzas]
 *     summary: Crear una categoría (ADMIN/SUPERVISOR)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, tipo]
 *             properties:
 *               nombre: { type: string }
 *               tipo: { type: string, enum: [INGRESO, EGRESO] }
 *     responses:
 *       201: { description: Categoría creada }
 */
finanzasRouter.get('/categorias', categoriasController.list);
finanzasRouter.post('/categorias', gestor, validate({ body: createCategoriaSchema }), categoriasController.create);
finanzasRouter.patch(
  '/categorias/:id',
  gestor,
  validate({ params: categoriaIdParamSchema, body: updateCategoriaSchema }),
  categoriasController.update,
);
finanzasRouter.delete(
  '/categorias/:id',
  rbac(RolUsuario.ADMIN),
  validate({ params: categoriaIdParamSchema }),
  categoriasController.delete,
);

/**
 * @openapi
 * /finanzas/centros-costo:
 *   get:
 *     tags: [Finanzas]
 *     summary: Listar centros de costo
 *     responses:
 *       200: { description: Listado de centros de costo }
 *   post:
 *     tags: [Finanzas]
 *     summary: Crear un centro de costo (ADMIN/SUPERVISOR)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre: { type: string }
 *     responses:
 *       201: { description: Centro de costo creado }
 */
finanzasRouter.get('/centros-costo', centrosCostoController.list);
finanzasRouter.post(
  '/centros-costo',
  gestor,
  validate({ body: createCentroCostoSchema }),
  centrosCostoController.create,
);
finanzasRouter.patch(
  '/centros-costo/:id',
  gestor,
  validate({ params: centroCostoIdParamSchema, body: updateCentroCostoSchema }),
  centrosCostoController.update,
);
finanzasRouter.delete(
  '/centros-costo/:id',
  rbac(RolUsuario.ADMIN),
  validate({ params: centroCostoIdParamSchema }),
  centrosCostoController.delete,
);

/**
 * @openapi
 * /finanzas/balance:
 *   get:
 *     tags: [Finanzas]
 *     summary: Balance (ingresos, egresos, rentabilidad y desglose por categoría) de un rango de fechas
 *     parameters:
 *       - in: query
 *         name: desde
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: hasta
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: cuentaId
 *         schema: { type: string }
 *     responses:
 *       200: { description: Balance del período (usar el rango del mes o del año para balance mensual/anual) }
 */
finanzasRouter.get('/balance', validate({ query: rangoFechasQuerySchema }), reportesController.balance);

/**
 * @openapi
 * /finanzas/flujo-caja:
 *   get:
 *     tags: [Finanzas]
 *     summary: Flujo de caja agrupado por día o mes, con saldo acumulado del período
 *     parameters:
 *       - in: query
 *         name: desde
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: hasta
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: groupBy
 *         schema: { type: string, enum: [dia, mes], default: mes }
 *       - in: query
 *         name: cuentaId
 *         schema: { type: string }
 *     responses:
 *       200: { description: Serie temporal de ingresos/egresos/saldo acumulado }
 */
finanzasRouter.get('/flujo-caja', validate({ query: flujoCajaQuerySchema }), reportesController.flujoCaja);

/**
 * @openapi
 * /finanzas/movimientos:
 *   get:
 *     tags: [Finanzas]
 *     summary: Listar movimientos financieros (filtrable, paginado)
 *     parameters:
 *       - in: query
 *         name: cuentaId
 *         schema: { type: string }
 *       - in: query
 *         name: categoriaId
 *         schema: { type: string }
 *       - in: query
 *         name: centroCostoId
 *         schema: { type: string }
 *       - in: query
 *         name: tipo
 *         schema: { type: string, enum: [INGRESO, EGRESO] }
 *       - in: query
 *         name: desde
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: hasta
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Listado paginado de movimientos }
 *   post:
 *     tags: [Finanzas]
 *     summary: Registrar un movimiento financiero (ADMIN/SUPERVISOR)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cuentaId, categoriaId, tipo, monto, fecha]
 *             properties:
 *               cuentaId: { type: string }
 *               categoriaId: { type: string }
 *               centroCostoId: { type: string }
 *               tipo: { type: string, enum: [INGRESO, EGRESO] }
 *               monto: { type: number }
 *               fecha: { type: string, format: date }
 *               descripcion: { type: string }
 *     responses:
 *       201: { description: Movimiento registrado }
 */
finanzasRouter.get(
  '/movimientos',
  validate({ query: listMovimientosQuerySchema }),
  movimientosController.list,
);
finanzasRouter.post(
  '/movimientos',
  gestor,
  validate({ body: createMovimientoSchema }),
  movimientosController.create,
);

/**
 * @openapi
 * /finanzas/movimientos/{id}:
 *   get:
 *     tags: [Finanzas]
 *     summary: Obtener un movimiento por id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Movimiento encontrado }
 *   patch:
 *     tags: [Finanzas]
 *     summary: Actualizar un movimiento (ADMIN/SUPERVISOR)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Movimiento actualizado }
 *   delete:
 *     tags: [Finanzas]
 *     summary: Eliminar un movimiento (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Movimiento eliminado }
 */
finanzasRouter.get(
  '/movimientos/:id',
  validate({ params: movimientoIdParamSchema }),
  movimientosController.getById,
);
finanzasRouter.patch(
  '/movimientos/:id',
  gestor,
  validate({ params: movimientoIdParamSchema, body: updateMovimientoSchema }),
  movimientosController.update,
);
finanzasRouter.delete(
  '/movimientos/:id',
  rbac(RolUsuario.ADMIN),
  validate({ params: movimientoIdParamSchema }),
  movimientosController.delete,
);

/**
 * @openapi
 * /finanzas/movimientos/{id}/adjuntos:
 *   post:
 *     tags: [Finanzas]
 *     summary: Adjuntar un comprobante a un movimiento (multipart/form-data, campo "file")
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
finanzasRouter.post(
  '/movimientos/:id/adjuntos',
  validate({ params: movimientoIdParamSchema }),
  adjuntoUpload.single('file'),
  movimientosController.addAdjunto,
);
