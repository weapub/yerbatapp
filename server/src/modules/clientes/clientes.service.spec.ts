import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../prisma/client', () => ({ prisma: {} }));

vi.mock('./clientes.repository', () => ({
  clientesRepository: {
    findManyPaginated: vi.fn(),
    findByIdInTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findUltimoMovimientoCC: vi.fn(),
    findMovimientosCC: vi.fn(),
    createMovimientoCC: vi.fn(),
    sumVentas: vi.fn(),
  },
}));

import { clientesRepository } from './clientes.repository';
import { clientesService } from './clientes.service';

const tenantId = 'tenant-1';
const clienteBase = {
  id: 'cliente-1',
  tenantId,
  razonSocial: 'Yerbatera del Norte',
  cuit: '30-11111111-1',
  contacto: null,
  email: null,
  telefono: null,
  direccion: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('clientesService.registrarMovimientoCC', () => {
  beforeEach(() => vi.clearAllMocks());

  it('una VENTA aumenta el saldo desde cero', async () => {
    vi.mocked(clientesRepository.findByIdInTenant).mockResolvedValue(clienteBase as never);
    vi.mocked(clientesRepository.findUltimoMovimientoCC).mockResolvedValue(null);
    vi.mocked(clientesRepository.createMovimientoCC).mockImplementation((data) =>
      Promise.resolve({ id: 'mov-1', ...data } as never),
    );

    const result = await clientesService.registrarMovimientoCC('cliente-1', tenantId, {
      tipo: 'VENTA',
      monto: 50000,
      fecha: new Date('2026-07-01'),
    });

    expect(result.saldo).toBe(50000);
    expect(result.monto).toBe(50000);
  });

  it('un COBRO resta del saldo anterior', async () => {
    vi.mocked(clientesRepository.findByIdInTenant).mockResolvedValue(clienteBase as never);
    vi.mocked(clientesRepository.findUltimoMovimientoCC).mockResolvedValue({
      id: 'mov-anterior',
      saldo: { toString: () => '50000' } as never,
    } as never);
    vi.mocked(clientesRepository.createMovimientoCC).mockImplementation((data) =>
      Promise.resolve({ id: 'mov-2', ...data } as never),
    );

    const result = await clientesService.registrarMovimientoCC('cliente-1', tenantId, {
      tipo: 'COBRO',
      monto: 20000,
      fecha: new Date('2026-07-10'),
    });

    expect(result.saldo).toBe(30000);
    expect(result.monto).toBe(-20000);
  });

  it('lanza 404 si el cliente no pertenece al tenant', async () => {
    vi.mocked(clientesRepository.findByIdInTenant).mockResolvedValue(null);

    await expect(
      clientesService.registrarMovimientoCC('cliente-ajeno', tenantId, { tipo: 'VENTA', monto: 100, fecha: new Date() }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(clientesRepository.createMovimientoCC).not.toHaveBeenCalled();
  });
});
