import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../prisma/client', () => ({ prisma: {} }));

vi.mock('./campanias.repository', () => ({
  campaniasRepository: {
    findManyByTenant: vi.fn(),
    findByIdInTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { campaniasRepository } from './campanias.repository';
import { campaniasService } from './campanias.service';

const tenantId = 'tenant-1';

describe('campaniasService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lanza 404 al actualizar una campaña de otro tenant', async () => {
    vi.mocked(campaniasRepository.findByIdInTenant).mockResolvedValue(null);

    await expect(
      campaniasService.update('campania-ajena', tenantId, { nombre: '2026/2027' }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(campaniasRepository.update).not.toHaveBeenCalled();
  });

  it('lanza 404 al eliminar una campaña inexistente', async () => {
    vi.mocked(campaniasRepository.findByIdInTenant).mockResolvedValue(null);

    await expect(campaniasService.delete('no-existe', tenantId)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('crea la campaña asociada al tenant correcto', async () => {
    vi.mocked(campaniasRepository.create).mockResolvedValue({ id: 'campania-1' } as never);

    await campaniasService.create(tenantId, {
      nombre: '2025/2026',
      fechaInicio: new Date('2025-07-01'),
      fechaFin: new Date('2026-06-30'),
    });

    expect(campaniasRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenant: { connect: { id: tenantId } } }),
    );
  });
});
