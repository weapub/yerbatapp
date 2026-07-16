import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TipoCuentaFinanciera } from '@prisma/client';

vi.mock('../../prisma/client', () => ({ prisma: {} }));

vi.mock('./lookups.repository', () => ({
  cuentasRepository: {
    findManyByTenant: vi.fn(),
    findByIdInTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    sumMovimientos: vi.fn(),
  },
  categoriasRepository: {
    findManyByTenant: vi.fn(),
    findByIdInTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  centrosCostoRepository: {
    findManyByTenant: vi.fn(),
    findByIdInTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { cuentasRepository, categoriasRepository } from './lookups.repository';
import { cuentasService, categoriasService } from './lookups.service';

const tenantId = 'tenant-1';

describe('cuentasService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calcula el saldoActual como saldoInicial + ingresos - egresos', async () => {
    vi.mocked(cuentasRepository.create).mockResolvedValue({
      id: 'cuenta-1',
      nombre: 'Caja principal',
      tipo: TipoCuentaFinanciera.CAJA,
      saldoInicial: { toString: () => '10000' } as never,
      createdAt: new Date(),
    } as never);
    vi.mocked(cuentasRepository.sumMovimientos).mockResolvedValue([
      { tipo: 'INGRESO', _sum: { monto: { toString: () => '50000' } as never } },
      { tipo: 'EGRESO', _sum: { monto: { toString: () => '15000' } as never } },
    ] as never);

    const result = await cuentasService.create(tenantId, {
      nombre: 'Caja principal',
      tipo: TipoCuentaFinanciera.CAJA,
      saldoInicial: 10000,
    });

    expect(result.saldoActual).toBe(45000); // 10000 + 50000 - 15000
  });

  it('lanza 404 al actualizar una cuenta de otro tenant', async () => {
    vi.mocked(cuentasRepository.findByIdInTenant).mockResolvedValue(null);

    await expect(cuentasService.update('cuenta-ajena', tenantId, { nombre: 'X' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('categoriasService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lanza 404 al eliminar una categoría inexistente', async () => {
    vi.mocked(categoriasRepository.findByIdInTenant).mockResolvedValue(null);

    await expect(categoriasService.delete('no-existe', tenantId)).rejects.toMatchObject({ statusCode: 404 });
  });
});
