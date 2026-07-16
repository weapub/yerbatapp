import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../prisma/client', () => ({ prisma: {} }));

vi.mock('./facturas.repository', () => ({
  facturasRepository: {
    findManyForIva: vi.fn(),
  },
}));

import { facturasRepository } from './facturas.repository';
import { ivaService } from './iva.service';

const tenantId = 'tenant-1';

describe('ivaService.panel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calcula débito fiscal, crédito fiscal y saldo técnico por mes', async () => {
    vi.mocked(facturasRepository.findManyForIva).mockResolvedValue([
      { fecha: new Date('2026-05-15'), operacion: 'VENTA', iva: { toString: () => '21000' } as never },
      { fecha: new Date('2026-05-20'), operacion: 'COMPRA', iva: { toString: () => '8000' } as never },
      { fecha: new Date('2026-06-01'), operacion: 'VENTA', iva: { toString: () => '10000' } as never },
    ] as never);

    const result = await ivaService.panel(tenantId, {
      desde: new Date('2026-05-01'),
      hasta: new Date('2026-06-30'),
    });

    expect(result.porMes).toEqual([
      { periodo: '2026-05', ivaVentas: 21000, ivaCompras: 8000, debitoFiscal: 21000, creditoFiscal: 8000, saldoTecnico: 13000 },
      { periodo: '2026-06', ivaVentas: 10000, ivaCompras: 0, debitoFiscal: 10000, creditoFiscal: 0, saldoTecnico: 10000 },
    ]);
    expect(result.totales).toEqual({
      periodo: 'total',
      ivaVentas: 31000,
      ivaCompras: 8000,
      debitoFiscal: 31000,
      creditoFiscal: 8000,
      saldoTecnico: 23000,
    });
  });

  it('un saldo técnico negativo indica saldo a favor (crédito > débito)', async () => {
    vi.mocked(facturasRepository.findManyForIva).mockResolvedValue([
      { fecha: new Date('2026-05-01'), operacion: 'VENTA', iva: { toString: () => '5000' } as never },
      { fecha: new Date('2026-05-02'), operacion: 'COMPRA', iva: { toString: () => '12000' } as never },
    ] as never);

    const result = await ivaService.panel(tenantId, {
      desde: new Date('2026-05-01'),
      hasta: new Date('2026-05-31'),
    });

    expect(result.totales.saldoTecnico).toBe(-7000);
  });
});
