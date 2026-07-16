import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TipoInsumo } from '@prisma/client';

vi.mock('../../prisma/client', () => ({ prisma: {} }));

vi.mock('./insumos.repository', () => ({
  insumosRepository: {
    findManyPaginated: vi.fn(),
    findByIdInTenant: vi.fn(),
    findCampoInTenant: vi.fn(),
    findCultivoInCampo: vi.fn(),
    findProductoInTenant: vi.fn(),
    findProveedorInTenant: vi.fn(),
    findUserInTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findManyForStats: vi.fn(),
  },
}));

import { insumosRepository } from './insumos.repository';
import { insumosService } from './insumos.service';

const tenantId = 'tenant-1';

const baseInput = {
  campoId: 'campo-1',
  cultivoId: 'cultivo-1',
  productoId: 'producto-1',
  proveedorId: 'proveedor-1',
  fecha: new Date('2026-03-01'),
  dosisHa: 50,
  cantidadUtilizada: 5500,
  costo: 80000,
  aplicadorId: 'user-1',
};

describe('insumosService.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('toma el tipo del producto elegido, no de la entrada del usuario', async () => {
    vi.mocked(insumosRepository.findCampoInTenant).mockResolvedValue({ id: 'campo-1' } as never);
    vi.mocked(insumosRepository.findCultivoInCampo).mockResolvedValue({ id: 'cultivo-1' } as never);
    vi.mocked(insumosRepository.findProveedorInTenant).mockResolvedValue({ id: 'proveedor-1' } as never);
    vi.mocked(insumosRepository.findProductoInTenant).mockResolvedValue({
      id: 'producto-1',
      tipo: TipoInsumo.HERBICIDA,
    } as never);
    vi.mocked(insumosRepository.findUserInTenant).mockResolvedValue({ id: 'user-1' } as never);
    vi.mocked(insumosRepository.create).mockImplementation((data) =>
      Promise.resolve({
        id: 'apl-1',
        ...data,
        campo: { nombre: 'Campo 1', superficieHa: 100 },
        cultivo: { nombre: 'Yerba Mate' },
        producto: { nombre: 'Glifosato', marca: 'X' },
        proveedor: { empresa: 'AgroSA' },
        aplicador: { nombre: 'Juan' },
      } as never),
    );

    await insumosService.create(tenantId, baseInput);

    expect(insumosRepository.create).toHaveBeenCalledWith(expect.objectContaining({ tipo: TipoInsumo.HERBICIDA }));
  });

  it('rechaza crear la aplicación si el producto no pertenece al proveedor indicado', async () => {
    vi.mocked(insumosRepository.findCampoInTenant).mockResolvedValue({ id: 'campo-1' } as never);
    vi.mocked(insumosRepository.findCultivoInCampo).mockResolvedValue({ id: 'cultivo-1' } as never);
    vi.mocked(insumosRepository.findProveedorInTenant).mockResolvedValue({ id: 'proveedor-1' } as never);
    vi.mocked(insumosRepository.findProductoInTenant).mockResolvedValue(null);

    await expect(insumosService.create(tenantId, baseInput)).rejects.toMatchObject({ statusCode: 404 });
    expect(insumosRepository.create).not.toHaveBeenCalled();
  });
});

describe('insumosService.estadisticas', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calcula promedios por hectárea, por cultivo, por año y costo total', async () => {
    vi.mocked(insumosRepository.findManyForStats).mockResolvedValue([
      {
        fecha: new Date('2025-03-01'),
        dosisHa: { toString: () => '40' } as never,
        costo: { toString: () => '60000' } as never,
        cultivoId: 'cultivo-1',
        cultivo: { nombre: 'Yerba Mate' },
        campo: { superficieHa: { toString: () => '100' } as never },
      },
      {
        fecha: new Date('2026-03-01'),
        dosisHa: { toString: () => '60' } as never,
        costo: { toString: () => '90000' } as never,
        cultivoId: 'cultivo-1',
        cultivo: { nombre: 'Yerba Mate' },
        campo: { superficieHa: { toString: () => '100' } as never },
      },
    ] as never);

    const result = await insumosService.estadisticas(tenantId, { tipo: TipoInsumo.FERTILIZANTE });

    expect(result.promedioDosisHa).toBe(50);
    expect(result.costoTotal).toBe(150000);
    expect(result.costoPromedioHa).toBe(750); // avg(600, 900)
    expect(result.porCultivo).toEqual([
      { cultivoId: 'cultivo-1', nombre: 'Yerba Mate', promedioDosisHa: 50, costoTotal: 150000 },
    ]);
    expect(result.porAnio).toEqual([
      { anio: 2025, promedioDosisHa: 40, costoTotal: 60000 },
      { anio: 2026, promedioDosisHa: 60, costoTotal: 90000 },
    ]);
  });

  it('devuelve valores en cero cuando no hay registros', async () => {
    vi.mocked(insumosRepository.findManyForStats).mockResolvedValue([]);

    const result = await insumosService.estadisticas(tenantId, { tipo: TipoInsumo.HERBICIDA });

    expect(result).toEqual({ promedioDosisHa: 0, costoTotal: 0, costoPromedioHa: 0, porCultivo: [], porAnio: [] });
  });
});
