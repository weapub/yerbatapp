import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { logger } from './config/logger';
import { corsOptions } from './config/cors';
import { swaggerSpec } from './config/swagger';
import { globalRateLimiter } from './middlewares/rateLimit.middleware';
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware';
import { resolveFromRepoRoot } from './shared/utils/paths';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { camposRouter } from './modules/campos/campos.routes';
import { cultivosRouter } from './modules/cultivos/cultivos.routes';
import { campaniasRouter } from './modules/campanias/campanias.routes';
import { rendimientosRouter } from './modules/rendimientos/rendimientos.routes';
import { proveedoresRouter } from './modules/proveedores/proveedores.routes';
import { insumosRouter } from './modules/insumos/insumos.routes';
import { tareasRouter } from './modules/tareas/tareas.routes';
import { finanzasRouter } from './modules/finanzas/finanzas.routes';
import { clientesRouter } from './modules/clientes/clientes.routes';
import { facturasRouter } from './modules/facturas/facturas.routes';
import { reportesRouter } from './modules/reportes/reportes.routes';
import { notificacionesRouter } from './modules/notificaciones/notificaciones.routes';
import { backupsRouter } from './modules/backups/backups.routes';
import { configuracionRouter } from './modules/configuracion/configuracion.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';

export const createApp = (): Express => {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(pinoHttp({ logger }));
  app.use(globalRateLimiter);

  app.use('/uploads', express.static(resolveFromRepoRoot(env.UPLOADS_DIR)));

  app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

  const api = express.Router();
  api.use('/auth', authRouter);
  api.use('/users', usersRouter);
  api.use('/campos', camposRouter);
  api.use('/cultivos', cultivosRouter);
  api.use('/campanias', campaniasRouter);
  api.use('/rendimientos', rendimientosRouter);
  api.use('/proveedores', proveedoresRouter);
  api.use('/insumos', insumosRouter);
  api.use('/tareas', tareasRouter);
  api.use('/finanzas', finanzasRouter);
  api.use('/clientes', clientesRouter);
  api.use('/facturas', facturasRouter);
  api.use('/reportes', reportesRouter);
  api.use('/notificaciones', notificacionesRouter);
  api.use('/backups', backupsRouter);
  api.use('/configuracion', configuracionRouter);
  api.use('/dashboard', dashboardRouter);
  app.use(env.API_PREFIX, api);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};
