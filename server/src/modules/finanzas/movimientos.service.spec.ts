import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TipoMovimientoFinanciero } from '@prisma/client';

vi.mock('../../prisma/client', () => ({ prisma: {} }));

vi.mock('./movimientos.repository', () => ({
  movimientosRepository: {
    findManyPaginated: vi.fn(),
    findByIdInTenant: vi.fn(),
    findCuentaInTenant: vi.fn(),
    findCategoriaInTenant: vi.fn(),
    findCentroCostoInTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    addAdjunto: vi.fn(),
  },
}));

import { movimientosRepository } from './movimientos.repository';
import { movimientosService } from './movimientos.service';

const tenantId = 'tenant-1';

const baseInput = {
  cuentaId: 'cuenta-1',
  categoriaId: 'categoria-1',
  tipo: TipoMovimientoFinanciero.INGRESO,
  monto: 50000,
  fecha: new Date('2026-05-01'),
};

describe('movimientosService.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rechaza crear el movimiento si la cuenta no pertenece al tenant', async () => {
    vi.mocked(movimientosRepository.findCuentaInTenant).mockResolvedValue(null);

    await expect(movimientosService.create(tenantId, baseInput)).rejects.toMatchObject({ statusCode: 404 });
    expect(movimientosRepository.create).not.toHaveBeenCalled();
  });

  it('rechaza crear el movimiento si el centro de costo no pertenece al tenant', async () => {
    vi.mocked(movimientosRepository.findCuentaInTenant).mockResolvedValue({ id: 'cuenta-1' } as never);
    vi.mocked(movimientosRepository.findCategoriaInTenant).mockResolvedValue({ id: 'categoria-1' } as never);
    vi.mocked(movimientosRepository.findCentroCostoInTenant).mockResolvedValue(null);

    await expect(
      movimientosService.create(tenantId, { ...baseInput, centroCostoId: 'centro-ajeno' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('convierte el monto (Decimal) a number en la respuesta', async () => {
    vi.mocked(movimientosRepository.findCuentaInTenant).mockResolvedValue({ id: 'cuenta-1' } as never);
    vi.mocked(movimientosRepository.findCategoriaInTenant).mockResolvedValue({ id: 'categoria-1' } as never);
    vi.mocked(movimientosRepository.create).mockResolvedValue({
      id: 'mov-1',
      monto: { toString: () => '50000' } as never,
    } as never);

    const result = await movimientosService.create(tenantId, baseInput);

    expect(result.monto).toBe(50000);
    expect(typeof result.monto).toBe('number');
  });
});

describe('movimientosService.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lanza 404 al actualizar un movimiento de otro tenant', async () => {
    vi.mocked(movimientosRepository.findByIdInTenant).mockResolvedValue(null);

    await expect(movimientosService.update('mov-ajeno', tenantId, { monto: 100 })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
