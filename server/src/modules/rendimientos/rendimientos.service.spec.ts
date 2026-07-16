import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnidadProduccion } from '@prisma/client';

vi.mock('../../prisma/client', () => ({ prisma: {} }));

vi.mock('./rendimientos.repository', () => ({
  rendimientosRepository: {
    findManyPaginated: vi.fn(),
    findByIdInTenant: vi.fn(),
    findCampoInTenant: vi.fn(),
    findCultivoInCampo: vi.fn(),
    findCampaniaInTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    groupByCampo: vi.fn(),
    groupByCultivo: vi.fn(),
    groupByCampania: vi.fn(),
    findCamposByIds: vi.fn(),
    findCultivosByIds: vi.fn(),
    findCampaniasByIds: vi.fn(),
  },
}));

import { rendimientosRepository } from './rendimientos.repository';
import { rendimientosService } from './rendimientos.service';

const tenantId = 'tenant-1';

describe('rendimientosService.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calcula rendimientoHa automáticamente a partir de la superficie del campo', async () => {
    vi.mocked(rendimientosRepository.findCampoInTenant).mockResolvedValue({
      id: 'campo-1',
      superficieHa: { toString: () => '100' } as never,
    } as never);
    vi.mocked(rendimientosRepository.findCultivoInCampo).mockResolvedValue({ id: 'cultivo-1' } as never);
    vi.mocked(rendimientosRepository.findCampaniaInTenant).mockResolvedValue({ id: 'campania-1' } as never);
    vi.mocked(rendimientosRepository.create).mockImplementation((data) =>
      Promise.resolve({
        id: 'rend-1',
        ...data,
        produccion: data.produccion,
        rendimientoHa: (data as never as { rendimientoHa: number }).rendimientoHa,
        costo: (data as never as { costo: number }).costo,
        ingreso: (data as never as { ingreso: number }).ingreso,
      } as never),
    );

    const result = await rendimientosService.create(tenantId, {
      campoId: 'campo-1',
      cultivoId: 'cultivo-1',
      campaniaId: 'campania-1',
      fecha: new Date('2026-05-01'),
      produccion: 5000,
      unidad: UnidadProduccion.KG,
      costo: 1000,
      ingreso: 3000,
    });

    expect(result.rendimientoHa).toBe(50); // 5000kg / 100ha
    expect(result.rentabilidad).toBe(2000);
  });

  it('rechaza crear el rendimiento si el cultivo no pertenece al campo indicado', async () => {
    vi.mocked(rendimientosRepository.findCampoInTenant).mockResolvedValue({
      id: 'campo-1',
      superficieHa: { toString: () => '100' } as never,
    } as never);
    vi.mocked(rendimientosRepository.findCultivoInCampo).mockResolvedValue(null);

    await expect(
      rendimientosService.create(tenantId, {
        campoId: 'campo-1',
        cultivoId: 'cultivo-de-otro-campo',
        campaniaId: 'campania-1',
        fecha: new Date(),
        produccion: 100,
        unidad: UnidadProduccion.KG,
        costo: 0,
        ingreso: 0,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(rendimientosRepository.create).not.toHaveBeenCalled();
  });

  it('rechaza crear el rendimiento si la campaña no existe en el tenant', async () => {
    vi.mocked(rendimientosRepository.findCampoInTenant).mockResolvedValue({
      id: 'campo-1',
      superficieHa: { toString: () => '100' } as never,
    } as never);
    vi.mocked(rendimientosRepository.findCultivoInCampo).mockResolvedValue({ id: 'cultivo-1' } as never);
    vi.mocked(rendimientosRepository.findCampaniaInTenant).mockResolvedValue(null);

    await expect(
      rendimientosService.create(tenantId, {
        campoId: 'campo-1',
        cultivoId: 'cultivo-1',
        campaniaId: 'campania-ajena',
        fecha: new Date(),
        produccion: 100,
        unidad: UnidadProduccion.KG,
        costo: 0,
        ingreso: 0,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('rendimientosService.comparativa', () => {
  beforeEach(() => vi.clearAllMocks());

  it('arma la comparativa por campaña con rentabilidad calculada', async () => {
    vi.mocked(rendimientosRepository.groupByCampania).mockResolvedValue([
      {
        campaniaId: 'campania-1',
        _sum: { produccion: { toString: () => '10000' }, costo: { toString: () => '2000' }, ingreso: { toString: () => '6000' } },
        _avg: { rendimientoHa: { toString: () => '80' } },
      } as never,
    ]);
    vi.mocked(rendimientosRepository.findCampaniasByIds).mockResolvedValue([
      { id: 'campania-1', nombre: '2025/2026' },
    ] as never);

    const result = await rendimientosService.comparativa(tenantId, { groupBy: 'campania' });

    expect(result).toEqual([
      {
        key: 'campania-1',
        label: '2025/2026',
        totalProduccion: 10000,
        totalCosto: 2000,
        totalIngreso: 6000,
        rentabilidad: 4000,
        rendimientoPromedioHa: 80,
      },
    ]);
  });
});
