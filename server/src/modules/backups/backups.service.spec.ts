import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../prisma/client', () => ({ prisma: {} }));

vi.mock('./backups.repository', () => ({
  backupsRepository: {
    create: vi.fn(),
    update: vi.fn(),
    findManyByTenant: vi.fn(),
    findByIdInTenant: vi.fn(),
  },
}));

vi.mock('node:fs', () => ({
  default: {
    mkdirSync: vi.fn(),
    statSync: vi.fn(() => ({ size: 12345 })),
    existsSync: vi.fn(() => true),
  },
}));

type ExecFileCallback = (error: Error | null, result?: { stdout: string; stderr: string }) => void;
const execFileMock = vi.fn((_file: string, _args: string[], _options: unknown, callback: ExecFileCallback) => {
  callback(null, { stdout: '', stderr: '' });
});

vi.mock('node:child_process', () => ({ execFile: (...args: unknown[]) => (execFileMock as never)(...args) }));

import { backupsRepository } from './backups.repository';
import { backupsService } from './backups.service';

const tenantId = 'tenant-1';

describe('backupsService.crear', () => {
  beforeEach(() => vi.clearAllMocks());

  it('crea el log EN_PROGRESO, corre pg_dump y lo marca COMPLETADO con tamaño', async () => {
    vi.mocked(backupsRepository.create).mockResolvedValue({ id: 'backup-1' } as never);
    vi.mocked(backupsRepository.update).mockResolvedValue({
      id: 'backup-1',
      estado: 'COMPLETADO',
      tamanioBytes: BigInt(12345),
    } as never);
    execFileMock.mockImplementation((_f, _a, _o, cb: ExecFileCallback) => cb(null, { stdout: '', stderr: '' }));

    const result = await backupsService.crear(tenantId, 'MANUAL');

    expect(result.tamanioBytes).toBe('12345');

    expect(backupsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'MANUAL', estado: 'EN_PROGRESO' }),
    );
    expect(backupsRepository.update).toHaveBeenCalledWith(
      'backup-1',
      expect.objectContaining({ estado: 'COMPLETADO', tamanioBytes: 12345n }),
    );
  });

  it('marca el backup como FALLIDO si pg_dump devuelve error', async () => {
    vi.mocked(backupsRepository.create).mockResolvedValue({ id: 'backup-2' } as never);
    execFileMock.mockImplementation((_f, _a, _o, cb: ExecFileCallback) => cb(new Error('pg_dump no encontrado')));

    await expect(backupsService.crear(tenantId, 'AUTOMATICO')).rejects.toMatchObject({ statusCode: 500 });

    expect(backupsRepository.update).toHaveBeenCalledWith('backup-2', expect.objectContaining({ estado: 'FALLIDO' }));
  });
});

describe('backupsService.getArchivoPath', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lanza 404 si el backup no existe para ese tenant', async () => {
    vi.mocked(backupsRepository.findByIdInTenant).mockResolvedValue(null);

    await expect(backupsService.getArchivoPath('backup-ajeno', tenantId)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('lanza 404 si el backup no tiene archivoUrl (nunca completó)', async () => {
    vi.mocked(backupsRepository.findByIdInTenant).mockResolvedValue({ id: 'backup-1', archivoUrl: null } as never);

    await expect(backupsService.getArchivoPath('backup-1', tenantId)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('backupsService.restaurar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('propaga un error claro si psql falla', async () => {
    vi.mocked(backupsRepository.findByIdInTenant).mockResolvedValue({
      id: 'backup-1',
      archivoUrl: 'yerbatapp_2026.sql',
    } as never);
    execFileMock.mockImplementation((_f, _a, _o, cb: ExecFileCallback) => cb(new Error('psql falló')));

    await expect(backupsService.restaurar('backup-1', tenantId)).rejects.toMatchObject({ statusCode: 500 });
  });
});
