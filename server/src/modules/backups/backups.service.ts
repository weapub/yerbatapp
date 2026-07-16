import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { BackupLog, TipoBackup } from '@prisma/client';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AppError } from '../../shared/errors/AppError';
import { parseDbUrl } from '../../shared/utils/dbUrl';
import { resolveFromRepoRoot } from '../../shared/utils/paths';
import { backupsRepository } from './backups.repository';

const execFileAsync = promisify(execFile);

// BigInt no es serializable por JSON.stringify (lo que usa res.json internamente):
// se expone como string, suficiente para mostrar el tamaño en la UI.
const toBackupDto = (backup: BackupLog) => ({
  ...backup,
  tamanioBytes: backup.tamanioBytes === null ? null : backup.tamanioBytes.toString(),
});

const backupsDir = resolveFromRepoRoot(env.BACKUPS_DIR);

const ensureBackupsDir = (): void => {
  fs.mkdirSync(backupsDir, { recursive: true });
};

const nombreArchivo = (): string => {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return `yerbatapp_${ts}.sql`;
};

/**
 * El backup es un dump completo de la base (todas las tablas, no filtrado por
 * tenant): con el esquema "shared schema" actual eso es lo correcto — cuando se
 * active multi-tenant real, restaurar seguirá siendo una operación a nivel de
 * infraestructura, no de un tenant individual.
 */
export const backupsService = {
  async crear(tenantId: string, tipo: TipoBackup) {
    ensureBackupsDir();
    const filename = nombreArchivo();
    const destino = path.join(backupsDir, filename);

    const log = await backupsRepository.create({
      tenant: { connect: { id: tenantId } },
      tipo,
      estado: 'EN_PROGRESO',
    });

    const { host, port, user, password, database } = parseDbUrl(env.DATABASE_URL);

    try {
      await execFileAsync(
        env.PG_DUMP_PATH,
        ['-h', host, '-p', port, '-U', user, '-F', 'p', '--no-owner', '--no-privileges', '-f', destino, database],
        { env: { ...process.env, PGPASSWORD: password }, timeout: 5 * 60 * 1000 },
      );

      const { size } = fs.statSync(destino);
      const backup = await backupsRepository.update(log.id, {
        estado: 'COMPLETADO',
        archivoUrl: filename,
        tamanioBytes: BigInt(size),
        finalizadoEn: new Date(),
      });
      return toBackupDto(backup);
    } catch (error) {
      logger.error({ error }, 'Falló la generación del backup');
      await backupsRepository.update(log.id, { estado: 'FALLIDO', finalizadoEn: new Date() });
      throw AppError.internal('No se pudo generar el backup. Revisar que pg_dump esté disponible (PG_DUMP_PATH).');
    }
  },

  async list(tenantId: string) {
    const backups = await backupsRepository.findManyByTenant(tenantId);
    return backups.map(toBackupDto);
  },

  async getArchivoPath(id: string, tenantId: string): Promise<{ path: string; filename: string }> {
    const backup = await backupsRepository.findByIdInTenant(id, tenantId);
    if (!backup || !backup.archivoUrl) throw AppError.notFound('Backup no encontrado o sin archivo disponible');
    const filePath = path.join(backupsDir, backup.archivoUrl);
    if (!fs.existsSync(filePath)) throw AppError.notFound('El archivo de backup ya no existe en disco');
    return { path: filePath, filename: backup.archivoUrl };
  },

  /**
   * Restaura la base desde un backup existente. DESTRUCTIVO: reemplaza los datos
   * actuales. Requiere confirmación explícita del cliente (ver validation) además
   * del rol ADMIN ya exigido por la ruta.
   */
  async restaurar(id: string, tenantId: string): Promise<void> {
    const { path: filePath } = await this.getArchivoPath(id, tenantId);
    const { host, port, user, password, database } = parseDbUrl(env.DATABASE_URL);

    try {
      await execFileAsync(env.PSQL_PATH, ['-h', host, '-p', port, '-U', user, '-d', database, '-f', filePath], {
        env: { ...process.env, PGPASSWORD: password },
        timeout: 10 * 60 * 1000,
      });
    } catch (error) {
      logger.error({ error, backupId: id }, 'Falló la restauración del backup');
      throw AppError.internal('No se pudo restaurar el backup. Revisar los logs del servidor.');
    }
  },
};
