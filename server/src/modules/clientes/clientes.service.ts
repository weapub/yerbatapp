import { Cliente } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError';
import { buildPaginationMeta, PaginatedResult } from '../../shared/utils/pagination';
import { clientesRepository } from './clientes.repository';
import { CreateClienteInput, ListClientesQuery, MovimientoCCClienteInput, UpdateClienteInput } from './clientes.validation';

const getClienteOrThrow = async (id: string, tenantId: string) => {
  const cliente = await clientesRepository.findByIdInTenant(id, tenantId);
  if (!cliente) throw AppError.notFound('Cliente no encontrado');
  return cliente;
};

const toClienteDto = async (cliente: Cliente) => {
  const [ultimoMovimiento, ventas] = await Promise.all([
    clientesRepository.findUltimoMovimientoCC(cliente.id),
    clientesRepository.sumVentas(cliente.id),
  ]);

  return {
    ...cliente,
    saldo: ultimoMovimiento ? Number(ultimoMovimiento.saldo) : 0,
    totalVentas: Number(ventas._sum.monto ?? 0),
  };
};

export const clientesService = {
  async list(tenantId: string, query: ListClientesQuery): Promise<PaginatedResult<Awaited<ReturnType<typeof toClienteDto>>>> {
    const { data, total } = await clientesRepository.findManyPaginated(tenantId, query);
    return { data: await Promise.all(data.map(toClienteDto)), meta: buildPaginationMeta(total, query) };
  },

  async getById(id: string, tenantId: string) {
    return toClienteDto(await getClienteOrThrow(id, tenantId));
  },

  async create(tenantId: string, input: CreateClienteInput) {
    const cliente = await clientesRepository.create({
      razonSocial: input.razonSocial,
      cuit: input.cuit,
      contacto: input.contacto,
      email: input.email || undefined,
      telefono: input.telefono,
      direccion: input.direccion,
      tenant: { connect: { id: tenantId } },
    });
    return toClienteDto(cliente);
  },

  async update(id: string, tenantId: string, input: UpdateClienteInput) {
    await getClienteOrThrow(id, tenantId);
    const cliente = await clientesRepository.update(id, { ...input, email: input.email || undefined });
    return toClienteDto(cliente);
  },

  async delete(id: string, tenantId: string): Promise<void> {
    await getClienteOrThrow(id, tenantId);
    await clientesRepository.delete(id);
  },

  async listMovimientosCC(id: string, tenantId: string) {
    await getClienteOrThrow(id, tenantId);
    const movimientos = await clientesRepository.findMovimientosCC(id);
    return movimientos.map((m) => ({ ...m, monto: Number(m.monto), saldo: Number(m.saldo) }));
  },

  async registrarMovimientoCC(id: string, tenantId: string, input: MovimientoCCClienteInput) {
    await getClienteOrThrow(id, tenantId);

    const ultimo = await clientesRepository.findUltimoMovimientoCC(id);
    const saldoAnterior = ultimo ? Number(ultimo.saldo) : 0;
    // Convención de cuenta corriente: VENTA aumenta la deuda del cliente, COBRO la reduce.
    const montoFirmado = input.tipo === 'VENTA' ? input.monto : -input.monto;
    const saldoNuevo = saldoAnterior + montoFirmado;

    const movimiento = await clientesRepository.createMovimientoCC({
      cliente: { connect: { id } },
      monto: montoFirmado,
      saldo: saldoNuevo,
      fecha: input.fecha,
      descripcion: input.descripcion,
    });
    return { ...movimiento, monto: Number(movimiento.monto), saldo: Number(movimiento.saldo) };
  },
};
