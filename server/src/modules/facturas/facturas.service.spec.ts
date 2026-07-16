import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EstadoFactura, TipoFactura, TipoOperacionFactura } from '@prisma/client';

vi.mock('../../prisma/client', () => ({ prisma: {} }));

vi.mock('./facturas.repository', () => ({
  facturasRepository: {
    findManyPaginated: vi.fn(),
    findByIdInTenant: vi.fn(),
    findClienteInTenant: vi.fn(),
    findProveedorInTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    addAdjunto: vi.fn(),
  },
}));

vi.mock('../clientes/clientes.repository', () => ({
  clientesRepository: {
    findUltimoMovimientoCC: vi.fn(),
    createMovimientoCC: vi.fn(),
  },
}));

vi.mock('../proveedores/proveedores.repository', () => ({
  proveedoresRepository: {
    findUltimoMovimientoCC: vi.fn(),
    createMovimientoCC: vi.fn(),
  },
}));

import { facturasRepository } from './facturas.repository';
import { clientesRepository } from '../clientes/clientes.repository';
import { proveedoresRepository } from '../proveedores/proveedores.repository';
import { facturasService } from './facturas.service';

const tenantId = 'tenant-1';

const baseInput = {
  tipo: TipoFactura.A,
  operacion: TipoOperacionFactura.VENTA,
  numero: '0001-00001234',
  clienteId: 'cliente-1',
  fecha: new Date('2026-07-01'),
  importeNeto: 100000,
  iva: 21000,
};

describe('facturasService.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calcula total = importeNeto + iva', async () => {
    vi.mocked(facturasRepository.findClienteInTenant).mockResolvedValue({ id: 'cliente-1' } as never);
    vi.mocked(facturasRepository.create).mockImplementation((data) =>
      Promise.resolve({ id: 'factura-1', ...data } as never),
    );
    vi.mocked(clientesRepository.findUltimoMovimientoCC).mockResolvedValue(null);

    const result = await facturasService.create(tenantId, baseInput);

    expect(result.total).toBe(121000);
  });

  it('genera un movimiento de cuenta corriente del cliente al crear una factura de VENTA', async () => {
    vi.mocked(facturasRepository.findClienteInTenant).mockResolvedValue({ id: 'cliente-1' } as never);
    vi.mocked(facturasRepository.create).mockResolvedValue({
      id: 'factura-1',
      tipo: TipoFactura.A,
      operacion: TipoOperacionFactura.VENTA,
      numero: '0001-00001234',
      clienteId: 'cliente-1',
      proveedorId: null,
      fecha: new Date('2026-07-01'),
      total: { toString: () => '121000' } as never,
    } as never);
    vi.mocked(clientesRepository.findUltimoMovimientoCC).mockResolvedValue({
      saldo: { toString: () => '50000' } as never,
    } as never);

    await facturasService.create(tenantId, baseInput);

    expect(clientesRepository.createMovimientoCC).toHaveBeenCalledWith(
      expect.objectContaining({ monto: 121000, saldo: 171000 }),
    );
    expect(proveedoresRepository.createMovimientoCC).not.toHaveBeenCalled();
  });

  it('genera un movimiento de cuenta corriente del proveedor al crear una factura de COMPRA', async () => {
    vi.mocked(facturasRepository.findProveedorInTenant).mockResolvedValue({ id: 'prov-1' } as never);
    vi.mocked(facturasRepository.create).mockResolvedValue({
      id: 'factura-2',
      tipo: TipoFactura.A,
      operacion: TipoOperacionFactura.COMPRA,
      numero: '0001-00005678',
      clienteId: null,
      proveedorId: 'prov-1',
      fecha: new Date('2026-07-01'),
      total: { toString: () => '50000' } as never,
    } as never);
    vi.mocked(proveedoresRepository.findUltimoMovimientoCC).mockResolvedValue(null);

    await facturasService.create(tenantId, {
      tipo: TipoFactura.A,
      operacion: TipoOperacionFactura.COMPRA,
      numero: '0001-00005678',
      proveedorId: 'prov-1',
      fecha: new Date('2026-07-01'),
      importeNeto: 41322.31,
      iva: 8677.69,
    });

    expect(proveedoresRepository.createMovimientoCC).toHaveBeenCalledWith(
      expect.objectContaining({ monto: 50000, saldo: 50000 }),
    );
    expect(clientesRepository.createMovimientoCC).not.toHaveBeenCalled();
  });

  it('lanza 404 si el cliente indicado no pertenece al tenant', async () => {
    vi.mocked(facturasRepository.findClienteInTenant).mockResolvedValue(null);

    await expect(facturasService.create(tenantId, baseInput)).rejects.toMatchObject({ statusCode: 404 });
    expect(facturasRepository.create).not.toHaveBeenCalled();
  });
});

describe('facturasService.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lanza 404 al actualizar una factura de otro tenant', async () => {
    vi.mocked(facturasRepository.findByIdInTenant).mockResolvedValue(null);

    await expect(
      facturasService.update('factura-ajena', tenantId, { estado: EstadoFactura.PAGADA }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
