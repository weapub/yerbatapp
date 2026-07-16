import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { dashboardController } from './dashboard.controller';

export const dashboardRouter = Router();
dashboardRouter.use(authMiddleware, tenantMiddleware);

/**
 * @openapi
 * /dashboard/resumen:
 *   get:
 *     tags: [Dashboard]
 *     summary: KPIs generales del tenant (superficie, campos, cultivos, actividad reciente)
 *     responses:
 *       200: { description: Resumen de indicadores }
 */
dashboardRouter.get('/resumen', dashboardController.getResumen);
