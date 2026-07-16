import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TipoInsumo } from '@prisma/client';

vi.mock('../../prisma/client', () => ({ prisma: {} }));

vi.mock('./proveedores.repository', () => ({
  proveedoresRepository: {
    findManyPaginated: vi.fn(),
    findByIdInTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    createProducto: vi.fn(),
    findAplicacionesByProveedor: vi.fn(),
    findUltimoMovimientoCC: vi.fn(),
    findMovimientosCC: vi.fn(),
    createMovimientoCC: vi.fn(),
    sumCompras: vi.fn(),
  },
}));

import { proveedoresRepository } from './proveedores.repository';
import { proveedoresService } from './proveedores.service';

const tenantId = 'tenant-1';

describe('proveedoresService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lanza 404 al agregar un producto a un proveedor de otro tenant', async () => {
    vi.mocked(proveedoresRepository.findByIdInTenant).mockResolvedValue(null);

    await expect(
      proveedoresService.createProducto('proveedor-ajeno', tenantId, {
        nombre: 'Urea',
        tipo: TipoInsumo.FERTILIZANTE,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(proveedoresRepository.createProducto).not.toHaveBeenCalled();
  });

  it('normaliza el email vacío a undefined al crear', async () => {
    vi.mocked(proveedoresRepository.create).mockResolvedValue({ id: 'prov-1' } as never);

    await proveedoresService.create(tenantId, { empresa: 'AgroInsumos SA', cuit: '30-12345678-9', email: '' });

    expect(proveedoresRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: undefined }),
    );
  });

  it('lanza 404 al pedir el historial de un proveedor inexistente', async () => {
    vi.mocked(proveedoresRepository.findByIdInTenant).mockResolvedValue(null);

    await expect(proveedoresService.historialAplicaciones('no-existe', tenantId)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('una COMPRA aumenta el saldo que le debemos al proveedor', async () => {
    vi.mocked(proveedoresRepository.findByIdInTenant).mockResolvedValue({ id: 'prov-1' } as never);
    vi.mocked(proveedoresRepository.findUltimoMovimientoCC).mockResolvedValue(null);
    vi.mocked(proveedoresRepository.createMovimientoCC).mockImplementation((data) =>
      Promise.resolve({ id: 'mov-1', ...data } as never),
    );

    const result = await proveedoresService.registrarMovimientoCC('prov-1', tenantId, {
      tipo: 'COMPRA',
      monto: 40000,
      fecha: new Date('2026-07-01'),
    });

    expect(result.saldo).toBe(40000);
  });

  it('un PAGO reduce el saldo anterior', async () => {
    vi.mocked(proveedoresRepository.findByIdInTenant).mockResolvedValue({ id: 'prov-1' } as never);
    vi.mocked(proveedoresRepository.findUltimoMovimientoCC).mockResolvedValue({
      saldo: { toString: () => '40000' } as never,
    } as never);
    vi.mocked(proveedoresRepository.createMovimientoCC).mockImplementation((data) =>
      Promise.resolve({ id: 'mov-2', ...data } as never),
    );

    const result = await proveedoresService.registrarMovimientoCC('prov-1', tenantId, {
      tipo: 'PAGO',
      monto: 15000,
      fecha: new Date('2026-07-10'),
    });

    expect(result.saldo).toBe(25000);
  });
});
