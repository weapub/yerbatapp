import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EstadoSanitario } from '@prisma/client';

vi.mock('../../prisma/client', () => ({ prisma: {} }));

vi.mock('./cultivos.repository', () => ({
  cultivosRepository: {
    findManyPaginated: vi.fn(),
    findByIdInTenant: vi.fn(),
    findCampoInTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    createHistorial: vi.fn(),
  },
}));

import { cultivosRepository } from './cultivos.repository';
import { cultivosService } from './cultivos.service';

const tenantId = 'tenant-1';

const dbCultivo = {
  id: 'cultivo-1',
  campoId: 'campo-1',
  nombre: 'Yerba Mate',
  variedad: null,
  fechaPlantacion: new Date('2020-01-01'),
  cantidadPlantas: 500,
  estadoSanitario: EstadoSanitario.BUENO,
  produccionEsperadaKg: { toString: () => '2500' } as never,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('cultivosService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rechaza crear un cultivo si el campo no pertenece al tenant', async () => {
    vi.mocked(cultivosRepository.findCampoInTenant).mockResolvedValue(null);

    await expect(
      cultivosService.create(tenantId, {
        campoId: 'campo-ajeno',
        nombre: 'Yerba Mate',
        fechaPlantacion: new Date(),
        cantidadPlantas: 100,
        estadoSanitario: EstadoSanitario.BUENO,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(cultivosRepository.create).not.toHaveBeenCalled();
  });

  it('convierte produccionEsperadaKg (Decimal) a number', async () => {
    vi.mocked(cultivosRepository.findByIdInTenant).mockResolvedValue(dbCultivo as never);

    const result = await cultivosService.getById('cultivo-1', tenantId);

    expect(result.produccionEsperadaKg).toBe(2500);
  });

  it('rechaza agregar historial a un cultivo inexistente', async () => {
    vi.mocked(cultivosRepository.findByIdInTenant).mockResolvedValue(null);

    await expect(
      cultivosService.addHistorial('no-existe', tenantId, { evento: 'Poda' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
