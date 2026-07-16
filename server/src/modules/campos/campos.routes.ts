import { Router } from 'express';
import { RolUsuario } from '@prisma/client';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbac } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { uploader } from '../../shared/utils/upload';
import { camposController } from './campos.controller';
import {
  campoIdParamSchema,
  createCampoSchema,
  createNotaSchema,
  listCamposQuerySchema,
  notaIdParamSchema,
  updateCampoSchema,
} from './campos.validation';

export const camposRouter = Router();
camposRouter.use(authMiddleware, tenantMiddleware);

const notaUpload = uploader('campos/notas');
const documentoUpload = uploader('campos/documentos');
const fotoUpload = uploader('campos/fotos');

/**
 * @openapi
 * /campos:
 *   get:
 *     tags: [Campos]
 *     summary: Listar campos del tenant (paginado, filtro por estado/búsqueda)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: estado
 *         schema: { type: string, enum: [ACTIVO, INACTIVO] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: Listado paginado de campos }
 */
camposRouter.get('/', validate({ query: listCamposQuerySchema }), camposController.list);

/**
 * @openapi
 * /campos/{id}:
 *   get:
 *     tags: [Campos]
 *     summary: Obtener un campo con sus cultivos y contadores
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Campo encontrado }
 *       404: { description: No encontrado }
 */
camposRouter.get('/:id', validate({ params: campoIdParamSchema }), camposController.getById);

/**
 * @openapi
 * /campos:
 *   post:
 *     tags: [Campos]
 *     summary: Crear un campo (ADMIN/SUPERVISOR)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, ubicacion, superficieHa]
 *             properties:
 *               nombre: { type: string }
 *               ubicacion: { type: string }
 *               superficieHa: { type: number }
 *               latitud: { type: number }
 *               longitud: { type: number }
 *               responsableId: { type: string }
 *               estado: { type: string, enum: [ACTIVO, INACTIVO] }
 *               observaciones: { type: string }
 *     responses:
 *       201: { description: Campo creado }
 */
camposRouter.post(
  '/',
  rbac(RolUsuario.ADMIN, RolUsuario.SUPERVISOR),
  validate({ body: createCampoSchema }),
  camposController.create,
);

/**
 * @openapi
 * /campos/{id}:
 *   patch:
 *     tags: [Campos]
 *     summary: Actualizar un campo (ADMIN/SUPERVISOR)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Campo actualizado }
 */
camposRouter.patch(
  '/:id',
  rbac(RolUsuario.ADMIN, RolUsuario.SUPERVISOR),
  validate({ params: campoIdParamSchema, body: updateCampoSchema }),
  camposController.update,
);

/**
 * @openapi
 * /campos/{id}:
 *   delete:
 *     tags: [Campos]
 *     summary: Eliminar un campo (solo ADMIN)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Campo eliminado }
 */
camposRouter.delete(
  '/:id',
  rbac(RolUsuario.ADMIN),
  validate({ params: campoIdParamSchema }),
  camposController.delete,
);

/**
 * @openapi
 * /campos/{id}/notas:
 *   get:
 *     tags: [Campos]
 *     summary: Listar notas de un campo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Listado de notas con adjuntos }
 *   post:
 *     tags: [Campos]
 *     summary: Crear una nota en un campo
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
 *             required: [titulo, descripcion]
 *             properties:
 *               titulo: { type: string }
 *               descripcion: { type: string }
 *     responses:
 *       201: { description: Nota creada }
 */
camposRouter.get('/:id/notas', validate({ params: campoIdParamSchema }), camposController.listNotas);
camposRouter.post(
  '/:id/notas',
  validate({ params: campoIdParamSchema, body: createNotaSchema }),
  camposController.createNota,
);

/**
 * @openapi
 * /campos/{id}/notas/{notaId}/adjuntos:
 *   post:
 *     tags: [Campos]
 *     summary: Adjuntar un archivo a una nota (multipart/form-data, campo "file")
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: notaId
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
camposRouter.post(
  '/:id/notas/:notaId/adjuntos',
  validate({ params: notaIdParamSchema }),
  notaUpload.single('file'),
  camposController.addNotaAdjunto,
);

/**
 * @openapi
 * /campos/{id}/documentos:
 *   get:
 *     tags: [Campos]
 *     summary: Listar documentos de un campo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Listado de documentos }
 *   post:
 *     tags: [Campos]
 *     summary: Subir un documento a un campo (multipart/form-data, campo "file")
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201: { description: Documento subido }
 */
camposRouter.get('/:id/documentos', validate({ params: campoIdParamSchema }), camposController.listDocumentos);
camposRouter.post(
  '/:id/documentos',
  validate({ params: campoIdParamSchema }),
  documentoUpload.single('file'),
  camposController.createDocumento,
);

/**
 * @openapi
 * /campos/{id}/fotos:
 *   get:
 *     tags: [Campos]
 *     summary: Listar fotos de un campo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Listado de fotos }
 *   post:
 *     tags: [Campos]
 *     summary: Subir una foto a un campo (multipart/form-data, campo "file")
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *               descripcion: { type: string }
 *     responses:
 *       201: { description: Foto subida }
 */
camposRouter.get('/:id/fotos', validate({ params: campoIdParamSchema }), camposController.listFotos);
camposRouter.post(
  '/:id/fotos',
  validate({ params: campoIdParamSchema }),
  fotoUpload.single('file'),
  camposController.createFoto,
);
