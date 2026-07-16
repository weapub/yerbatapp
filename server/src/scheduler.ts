import cron from 'node-cron';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './prisma/client';
import { alertasService } from './modules/notificaciones/alertas.service';
import { backupsService } from './modules/backups/backups.service';

/**
 * Tareas programadas del proceso. Se registran una sola vez desde server.ts (no
 * desde app.ts, para no duplicarlas en tests que instancian la app con supertest).
 */
export const iniciarTareasProgramadas = (): void => {
  if (!cron.validate(env.ALERTAS_CRON_SCHEDULE)) {
    logger.warn({ expr: env.ALERTAS_CRON_SCHEDULE }, 'ALERTAS_CRON_SCHEDULE inválido, no se programa');
  } else {
    cron.schedule(env.ALERTAS_CRON_SCHEDULE, async () => {
      logger.info('Cron: generando alertas automáticas de vencimientos...');
      try {
        await alertasService.generarAlertasAutomaticas();
      } catch (error) {
        logger.error({ error }, 'Cron de alertas automáticas falló');
      }
    });
  }

  if (!cron.validate(env.BACKUP_CRON_SCHEDULE)) {
    logger.warn({ expr: env.BACKUP_CRON_SCHEDULE }, 'BACKUP_CRON_SCHEDULE inválido, no se programa');
  } else {
    cron.schedule(env.BACKUP_CRON_SCHEDULE, async () => {
      logger.info('Cron: generando backup automático...');
      try {
        // El dump es de la base completa (shared schema): con un solo tenant activo
        // alcanza con asociar el registro al primero que se encuentre.
        const tenant = await prisma.tenant.findFirst({ where: { activo: true } });
        if (!tenant) {
          logger.warn('Cron de backup: no hay tenants activos, se omite esta corrida');
          return;
        }
        await backupsService.crear(tenant.id, 'AUTOMATICO');
      } catch (error) {
        logger.error({ error }, 'Cron de backup automático falló');
      }
    });
  }

  logger.info(
    { alertas: env.ALERTAS_CRON_SCHEDULE, backup: env.BACKUP_CRON_SCHEDULE },
    'Tareas programadas (cron) iniciadas',
  );
};
