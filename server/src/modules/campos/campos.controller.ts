import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/errors/AppError';
import { requireParam } from '../../shared/utils/params';
import { publicUrlFor } from '../../shared/utils/upload';
import { camposService } from './campos.service';

const requireAuth = (req: Request) => {
  if (!req.auth || !req.tenantId) throw AppError.unauthorized();
  return { userId: req.auth.sub, tenantId: req.tenantId };
};

export const camposController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = requireAuth(req);
    res.json(await camposService.list(tenantId, req.query as never));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = requireAuth(req);
    res.json(await camposService.getById(requireParam(req.params, 'id'), tenantId));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = requireAuth(req);
    res.status(201).json(await camposService.create(tenantId, req.body));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = requireAuth(req);
    res.json(await camposService.update(requireParam(req.params, 'id'), tenantId, req.body));
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = requireAuth(req);
    await camposService.delete(requireParam(req.params, 'id'), tenantId);
    res.status(204).send();
  }),

  listNotas: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = requireAuth(req);
    res.json(await camposService.listNotas(requireParam(req.params, 'id'), tenantId));
  }),

  createNota: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId, userId } = requireAuth(req);
    const nota = await camposService.createNota(requireParam(req.params, 'id'), tenantId, userId, req.body);
    res.status(201).json(nota);
  }),

  addNotaAdjunto: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = requireAuth(req);
    if (!req.file) throw AppError.badRequest('Archivo requerido');
    const adjunto = await camposService.addNotaAdjunto(
      requireParam(req.params, 'id'),
      requireParam(req.params, 'notaId'),
      tenantId,
      {
        url: publicUrlFor('campos/notas', req.file.filename),
        nombreArchivo: req.file.originalname,
        mimeType: req.file.mimetype,
      },
    );
    res.status(201).json(adjunto);
  }),

  listDocumentos: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = requireAuth(req);
    res.json(await camposService.listDocumentos(requireParam(req.params, 'id'), tenantId));
  }),

  createDocumento: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = requireAuth(req);
    if (!req.file) throw AppError.badRequest('Archivo requerido');
    const documento = await camposService.createDocumento(requireParam(req.params, 'id'), tenantId, {
      url: publicUrlFor('campos/documentos', req.file.filename),
      nombre: req.file.originalname,
      mimeType: req.file.mimetype,
    });
    res.status(201).json(documento);
  }),

  listFotos: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = requireAuth(req);
    res.json(await camposService.listFotos(requireParam(req.params, 'id'), tenantId));
  }),

  createFoto: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = requireAuth(req);
    if (!req.file) throw AppError.badRequest('Archivo requerido');
    const foto = await camposService.createFoto(requireParam(req.params, 'id'), tenantId, {
      url: publicUrlFor('campos/fotos', req.file.filename),
      descripcion: req.body.descripcion,
    });
    res.status(201).json(foto);
  }),
};
