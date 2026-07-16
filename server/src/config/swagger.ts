import path from 'node:path';
import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'YerbatApp API',
      version: '0.1.0',
      description:
        'API REST del ERP agropecuario YerbatApp. Todos los endpoints (salvo auth) requieren ' +
        'un Bearer token JWT obtenido en /auth/login.',
    },
    servers: [{ url: `http://localhost:${env.PORT}${env.API_PREFIX}`, description: 'Local' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    path.join(__dirname, '../modules/**/*.routes.ts'),
    path.join(__dirname, '../modules/**/*.routes.js'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
