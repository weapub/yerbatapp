import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EstadoCampo } from '@prisma/client';

vi.mock('../../prisma/client', () => ({ prisma: {} }));

vi.mock('./campos.repository', () => ({
  camposRepository: {
    findManyPaginated: vi.fn(),
    findByIdInTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findNotasByCampo: vi.fn(),
    createNota: vi.fn(),
    findNotaInCampo: vi.fn(),
    addNotaAdjunto: vi.fn(),
  },
}));

import { camposRepository } from './campos.repository';
import { camposService } from './campos.service';

const tenantId = 'tenant-1';

const dbCampo = {
  id: 'campo-1',
  tenantId,
  nombre: 'Campo 1',
  ubicacion: 'Oberá, Misiones',
  superficieHa: { toString: () => '120.50' } as never,
  latitud: null,
  longitud: null,
  responsableId: null,
  estado: EstadoCampo.ACTIVO,
  observaciones: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('camposService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('convierte superficieHa (Decimal) a number en la respuesta', async () => {
    vi.mocked(camposRepository.findByIdInTenant).mockResolvedValue(dbCampo as never);

    const result = await camposService.getById('campo-1', tenantId);

    expect(result.superficieHa).toBe(120.5);
    expect(typeof result.superficieHa).toBe('number');
  });

  it('lanza 404 si el campo no pertenece al tenant', async () => {
    vi.mocked(camposRepository.findByIdInTenant).mockResolvedValue(null);

    await expect(camposService.getById('no-existe', tenantId)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rechaza crear una nota en un campo inexistente', async () => {
    vi.mocked(camposRepository.findByIdInTenant).mockResolvedValue(null);

    await expect(
      camposService.createNota('no-existe', tenantId, 'user-1', { titulo: 'T', descripcion: 'D' }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(camposRepository.createNota).not.toHaveBeenCalled();
  });

  it('rechaza adjuntar archivo a una nota que no existe en ese campo', async () => {
    vi.mocked(camposRepository.findByIdInTenant).mockResolvedValue(dbCampo as never);
    vi.mocked(camposRepository.findNotaInCampo).mockResolvedValue(null);

    await expect(
      camposService.addNotaAdjunto('campo-1', 'nota-x', tenantId, {
        url: '/uploads/x',
        nombreArchivo: 'x.pdf',
        mimeType: 'application/pdf',
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
