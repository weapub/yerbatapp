import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbac } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { uploader } from '../../shared/utils/upload';
import { configuracionController } from './configuracion.controller';
import { parametroClaveParamSchema, updateEmpresaSchema, upsertParametroSchema } from './configuracion.validation';

export const configuracionRouter = Router();
configuracionRouter.use(authMiddleware, tenantMiddleware);

const soloAdmin = rbac(RolUsuario.ADMIN);
const logoUpload = uploader('empresa');

/**
 * @openapi
 * /configuracion/empresa:
 *   get:
 *     tags: [Configuración]
 *     summary: Datos de la empresa (razón social, CUIT, dirección, IVA general, logo)
 *     responses:
 *       200: { description: Configuración de la empresa }
 *   patch:
 *     tags: [Configuración]
 *     summary: Actualizar datos de la empresa (solo ADMIN)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               razonSocial: { type: string }
 *               cuit: { type: string }
 *               direccion: { type: string }
 *               telefono: { type: string }
 *               ivaGeneral: { type: number }
 *     responses:
 *       200: { description: Configuración actualizada }
 */
configuracionRouter.get('/empresa', configuracionController.getEmpresa);
configuracionRouter.patch(
  '/empresa',
  soloAdmin,
  validate({ body: updateEmpresaSchema }),
  configuracionController.updateEmpresa,
);

/**
 * @openapi
 * /configuracion/empresa/logo:
 *   post:
 *     tags: [Configuración]
 *     summary: Subir el logo de la empresa (solo ADMIN, multipart/form-data, campo "file")
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200: { description: Logo actualizado }
 */
configuracionRouter.post('/empresa/logo', soloAdmin, logoUpload.single('file'), configuracionController.updateLogo);

/**
 * @openapi
 * /configuracion/parametros:
 *   get:
 *     tags: [Configuración]
 *     summary: Listar parámetros del sistema (clave/valor)
 *     responses:
 *       200: { description: Listado de parámetros }
 */
configuracionRouter.get('/parametros', configuracionController.listParametros);

/**
 * @openapi
 * /configuracion/parametros/{clave}:
 *   put:
 *     tags: [Configuración]
 *     summary: Crear o actualizar un parámetro del sistema (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: clave
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [valor]
 *             properties:
 *               valor: { type: string }
 *     responses:
 *       200: { description: Parámetro guardado }
 *   delete:
 *     tags: [Configuración]
 *     summary: Eliminar un parámetro del sistema (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: clave
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Parámetro eliminado }
 */
configuracionRouter.put(
  '/parametros/:clave',
  soloAdmin,
  validate({ params: parametroClaveParamSchema, body: upsertParametroSchema }),
  configuracionController.upsertParametro,
);
configuracionRouter.delete(
  '/parametros/:clave',
  soloAdmin,
  validate({ params: parametroClaveParamSchema }),
  configuracionController.deleteParametro,
);
