import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../prisma/client', () => ({ prisma: {} }));

vi.mock('./movimientos.repository', () => ({
  movimientosRepository: {
    findManyForReporte: vi.fn(),
  },
}));

import { movimientosRepository } from './movimientos.repository';
import { reportesService } from './reportes.service';

const tenantId = 'tenant-1';

describe('reportesService.balance', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calcula ingresos, egresos, rentabilidad y desglose por categoría', async () => {
    vi.mocked(movimientosRepository.findManyForReporte).mockResolvedValue([
      { fecha: new Date('2026-05-01'), monto: { toString: () => '80000' } as never, tipo: 'INGRESO', categoriaId: 'cat-1', categoria: { nombre: 'Venta de yerba' } },
      { fecha: new Date('2026-05-10'), monto: { toString: () => '20000' } as never, tipo: 'EGRESO', categoriaId: 'cat-2', categoria: { nombre: 'Insumos' } },
    ] as never);

    const result = await reportesService.balance(tenantId, {
      desde: new Date('2026-05-01'),
      hasta: new Date('2026-05-31'),
    });

    expect(result.ingresos).toBe(80000);
    expect(result.egresos).toBe(20000);
    expect(result.rentabilidad).toBe(60000);
    expect(result.porCategoria).toEqual([
      { categoriaId: 'cat-1', nombre: 'Venta de yerba', tipo: 'INGRESO', total: 80000 },
      { categoriaId: 'cat-2', nombre: 'Insumos', tipo: 'EGRESO', total: 20000 },
    ]);
  });
});

describe('reportesService.flujoCaja', () => {
  beforeEach(() => vi.clearAllMocks());

  it('acumula el saldo mes a mes en orden cronológico', async () => {
    vi.mocked(movimientosRepository.findManyForReporte).mockResolvedValue([
      { fecha: new Date('2026-06-01'), monto: { toString: () => '10000' } as never, tipo: 'EGRESO', categoriaId: 'cat-1', categoria: { nombre: 'X' } },
      { fecha: new Date('2026-05-01'), monto: { toString: () => '50000' } as never, tipo: 'INGRESO', categoriaId: 'cat-1', categoria: { nombre: 'X' } },
    ] as never);

    const result = await reportesService.flujoCaja(tenantId, {
      desde: new Date('2026-05-01'),
      hasta: new Date('2026-06-30'),
      groupBy: 'mes',
    });

    expect(result).toEqual([
      { periodo: '2026-05', ingresos: 50000, egresos: 0, saldoAcumulado: 50000 },
      { periodo: '2026-06', ingresos: 0, egresos: 10000, saldoAcumulado: 40000 },
    ]);
  });
});
