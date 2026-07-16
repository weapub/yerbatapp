import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { AppError } from '../../shared/errors/AppError';
import { dashboardService } from './dashboard.service';

export const dashboardController = {
  getResumen: asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenantId) throw AppError.unauthorized();
    res.json(await dashboardService.getResumen(req.tenantId));
  }),
};
