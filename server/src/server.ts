import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './prisma/client';
import { iniciarTareasProgramadas } from './scheduler';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🧉 YerbatApp API escuchando en http://localhost:${env.PORT}${env.API_PREFIX}`);
  logger.info(`📚 Swagger disponible en http://localhost:${env.PORT}/api/docs`);
  iniciarTareasProgramadas();
});

const shutdown = async (signal: string) => {
  logger.info(`Recibida señal ${signal}, cerrando servidor...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
