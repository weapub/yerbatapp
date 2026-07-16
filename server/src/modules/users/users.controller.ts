import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/errors/AppError';
import { requireParam } from '../../shared/utils/params';
import { usersService } from './users.service';

const requireAuth = (req: Request) => {
  if (!req.auth || !req.tenantId) throw AppError.unauthorized();
  return { userId: req.auth.sub, tenantId: req.tenantId };
};

export const usersController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = requireAuth(req);
    res.json(await usersService.list(tenantId));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = requireAuth(req);
    res.json(await usersService.getById(requireParam(req.params, 'id'), tenantId));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = requireAuth(req);
    const user = await usersService.create(tenantId, req.body);
    res.status(201).json(user);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = requireAuth(req);
    res.json(await usersService.update(requireParam(req.params, 'id'), tenantId, req.body));
  }),

  deactivate: asyncHandler(async (req: Request, res: Response) => {
    const { tenantId, userId } = requireAuth(req);
    await usersService.deactivate(requireParam(req.params, 'id'), tenantId, userId);
    res.status(204).send();
  }),
};
