import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/errors/AppError';
import { requireParam } from '../../shared/utils/params';
import { notificacionesService } from './notificaciones.service';
import { alertasService } from './alertas.service';

const requireUserId = (req: Request) => {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth.sub;
};

export const notificacionesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await notificacionesService.list(requireUserId(req), req.query as never));
  }),

  countNoLeidas: asyncHandler(async (req: Request, res: Response) => {
    res.json({ noLeidas: await notificacionesService.countNoLeidas(requireUserId(req)) });
  }),

  marcarLeida: asyncHandler(async (req: Request, res: Response) => {
    res.json(await notificacionesService.marcarLeida(requireParam(req.params, 'id'), requireUserId(req)));
  }),

  marcarTodasLeidas: asyncHandler(async (req: Request, res: Response) => {
    await notificacionesService.marcarTodasLeidas(requireUserId(req));
    res.status(204).send();
  }),

  generarAlertas: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await alertasService.generarAlertasAutomaticas());
  }),
};
