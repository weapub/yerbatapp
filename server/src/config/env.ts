import { config } from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_PREFIX: z.string().default('/api/v1'),
  CLIENT_URL: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(20),

  UPLOADS_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_MB: z.coerce.number().default(10),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default('YerbatApp <no-reply@yerbatapp.com>'),

  // Backups: rutas a los binarios de cliente de Postgres. En Docker/producción con
  // el cliente en el PATH alcanza con los defaults; en Windows local suele hacer
  // falta apuntar a la ruta completa (ej. "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe").
  PG_DUMP_PATH: z.string().default('pg_dump'),
  PSQL_PATH: z.string().default('psql'),
  // Deliberadamente FUERA de UPLOADS_DIR: ese directorio se sirve como estático
  // público en /uploads, y un dump de base contiene hashes de contraseñas y tokens.
  // Los backups solo se descargan vía el endpoint autenticado GET /backups/:id/descargar.
  BACKUPS_DIR: z.string().default('./backups'),
  BACKUP_CRON_SCHEDULE: z.string().default('0 3 * * *'),
  ALERTAS_CRON_SCHEDULE: z.string().default('0 7 * * *'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  throw new Error('Configuración de entorno inválida. Revisar .env contra .env.example');
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
