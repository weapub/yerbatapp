import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../prisma/client', () => ({ prisma: {} }));

vi.mock('../rendimientos/rendimientos.repository', () => ({
  rendimientosRepository: { findManyPaginated: vi.fn() },
}));
vi.mock('../insumos/insumos.repository', () => ({ insumosRepository: { findManyPaginated: vi.fn() } }));
vi.mock('../campos/campos.repository', () => ({ camposRepository: { findManyPaginated: vi.fn() } }));
vi.mock('../cultivos/cultivos.repository', () => ({ cultivosRepository: { findManyPaginated: vi.fn() } }));
vi.mock('../proveedores/proveedores.service', () => ({ proveedoresService: { list: vi.fn() } }));
vi.mock('../clientes/clientes.service', () => ({ clientesService: { list: vi.fn() } }));
vi.mock('../facturas/facturas.repository', () => ({ facturasRepository: { findManyPaginated: vi.fn() } }));
vi.mock('../finanzas/movimientos.repository', () => ({ movimientosRepository: { findManyPaginated: vi.fn() } }));
vi.mock('../tareas/tareas.repository', () => ({ tareasRepository: { findManyPaginated: vi.fn() } }));
vi.mock('../facturas/iva.service', () => ({ ivaService: { panel: vi.fn() } }));

import { rendimientosRepository } from '../rendimientos/rendimientos.repository';
import { tareasRepository } from '../tareas/tareas.repository';
import { ivaService } from '../facturas/iva.service';
import { reportesService } from './reportes.service';

const tenantId = 'tenant-1';

describe('reportesService.generar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('produccion: filtra por rango de fechas y expone columnas planas', async () => {
    vi.mocked(rendimientosRepository.findManyPaginated).mockResolvedValue({
      data: [
        {
          fecha: new Date('2026-05-15'),
          campo: { nombre: 'Campo 1' },
          cultivo: { nombre: 'Yerba Mate' },
          campania: { nombre: '2025/2026' },
          produccion: { toString: () => '5000' } as never,
          unidad: 'KG',
          rendimientoHa: { toString: () => '50' } as never,
          costo: { toString: () => '1000' } as never,
          ingreso: { toString: () => '3000' } as never,
        },
        {
          fecha: new Date('2026-08-01'),
          campo: { nombre: 'Campo 2' },
          cultivo: { nombre: 'Yerba Mate' },
          campania: { nombre: '2025/2026' },
          produccion: { toString: () => '1000' } as never,
          unidad: 'KG',
          rendimientoHa: { toString: () => '20' } as never,
          costo: { toString: () => '200' } as never,
          ingreso: { toString: () => '600' } as never,
        },
      ],
      total: 2,
    } as never);

    const result = await reportesService.generar(tenantId, 'produccion', {
      desde: new Date('2026-05-01'),
      hasta: new Date('2026-06-30'),
    });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ campo: 'Campo 1', produccion: 5000 });
  });

  it('tareas: filtra por fechaProgramada dentro del rango', async () => {
    vi.mocked(tareasRepository.findManyPaginated).mockResolvedValue({
      data: [
        {
          tipo: 'PODA',
          campo: { nombre: 'Campo 1' },
          responsable: { nombre: 'Juan' },
          fechaProgramada: new Date('2026-03-01'),
          fechaRealizada: null,
          estado: 'PENDIENTE',
          prioridad: 'MEDIA',
        },
      ],
      total: 1,
    } as never);

    const result = await reportesService.generar(tenantId, 'tareas', {});

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ campo: 'Campo 1', responsable: 'Juan' });
  });

  it('iva: exige desde y hasta', async () => {
    await expect(reportesService.generar(tenantId, 'iva', {})).rejects.toMatchObject({ statusCode: 400 });
    expect(ivaService.panel).not.toHaveBeenCalled();
  });

  it('iva: agrega una fila TOTAL a partir del panel', async () => {
    vi.mocked(ivaService.panel).mockResolvedValue({
      porMes: [{ periodo: '2026-05', ivaVentas: 100, ivaCompras: 40, debitoFiscal: 100, creditoFiscal: 40, saldoTecnico: 60 }],
      totales: { periodo: 'total', ivaVentas: 100, ivaCompras: 40, debitoFiscal: 100, creditoFiscal: 40, saldoTecnico: 60 },
    });

    const result = await reportesService.generar(tenantId, 'iva', {
      desde: new Date('2026-05-01'),
      hasta: new Date('2026-05-31'),
    });

    expect(result.rows).toHaveLength(2);
    expect(result.rows[1]).toMatchObject({ periodo: 'TOTAL', saldoTecnico: 60 });
  });
});
