import { AppError } from '../../shared/errors/AppError';
import { buildPaginationMeta, PaginatedResult } from '../../shared/utils/pagination';
import { proveedoresRepository } from './proveedores.repository';
import { toAplicacionHistorialDto } from './proveedores.dto';
import {
  CreateProductoInput,
  CreateProveedorInput,
  ListProveedoresQuery,
  MovimientoCCProveedorInput,
  UpdateProveedorInput,
} from './proveedores.validation';

const getProveedorOrThrow = async (id: string, tenantId: string) => {
  const proveedor = await proveedoresRepository.findByIdInTenant(id, tenantId);
  if (!proveedor) throw AppError.notFound('Proveedor no encontrado');
  return proveedor;
};

const withSaldo = async <T extends { id: string }>(proveedor: T) => {
  const [ultimoMovimiento, compras] = await Promise.all([
    proveedoresRepository.findUltimoMovimientoCC(proveedor.id),
    proveedoresRepository.sumCompras(proveedor.id),
  ]);
  return {
    ...proveedor,
    saldo: ultimoMovimiento ? Number(ultimoMovimiento.saldo) : 0,
    totalCompras: Number(compras._sum.monto ?? 0),
  };
};

export const proveedoresService = {
  async list(tenantId: string, query: ListProveedoresQuery): Promise<PaginatedResult<unknown>> {
    const { data, total } = await proveedoresRepository.findManyPaginated(tenantId, query);
    return { data: await Promise.all(data.map(withSaldo)), meta: buildPaginationMeta(total, query) };
  },

  async getById(id: string, tenantId: string) {
    return withSaldo(await getProveedorOrThrow(id, tenantId));
  },

  create: (tenantId: string, input: CreateProveedorInput) =>
    proveedoresRepository.create({
      empresa: input.empresa,
      cuit: input.cuit,
      contacto: input.contacto,
      direccion: input.direccion,
      telefono: input.telefono,
      email: input.email || undefined,
      tenant: { connect: { id: tenantId } },
    }),

  async update(id: string, tenantId: string, input: UpdateProveedorInput) {
    await getProveedorOrThrow(id, tenantId);
    return proveedoresRepository.update(id, { ...input, email: input.email || undefined });
  },

  async delete(id: string, tenantId: string): Promise<void> {
    await getProveedorOrThrow(id, tenantId);
    await proveedoresRepository.delete(id);
  },

  async createProducto(proveedorId: string, tenantId: string, input: CreateProductoInput) {
    await getProveedorOrThrow(proveedorId, tenantId);
    return proveedoresRepository.createProducto(proveedorId, input);
  },

  async historialAplicaciones(proveedorId: string, tenantId: string) {
    await getProveedorOrThrow(proveedorId, tenantId);
    const aplicaciones = await proveedoresRepository.findAplicacionesByProveedor(proveedorId);
    return aplicaciones.map(toAplicacionHistorialDto);
  },

  async listMovimientosCC(proveedorId: string, tenantId: string) {
    await getProveedorOrThrow(proveedorId, tenantId);
    const movimientos = await proveedoresRepository.findMovimientosCC(proveedorId);
    return movimientos.map((m) => ({ ...m, monto: Number(m.monto), saldo: Number(m.saldo) }));
  },

  async registrarMovimientoCC(proveedorId: string, tenantId: string, input: MovimientoCCProveedorInput) {
    await getProveedorOrThrow(proveedorId, tenantId);

    const ultimo = await proveedoresRepository.findUltimoMovimientoCC(proveedorId);
    const saldoAnterior = ultimo ? Number(ultimo.saldo) : 0;
    // Convención de cuenta corriente: COMPRA aumenta lo que le debemos al proveedor, PAGO lo reduce.
    const montoFirmado = input.tipo === 'COMPRA' ? input.monto : -input.monto;
    const saldoNuevo = saldoAnterior + montoFirmado;

    const movimiento = await proveedoresRepository.createMovimientoCC({
      proveedor: { connect: { id: proveedorId } },
      monto: montoFirmado,
      saldo: saldoNuevo,
      fecha: input.fecha,
      descripcion: input.descripcion,
    });
    return { ...movimiento, monto: Number(movimiento.monto), saldo: Number(movimiento.saldo) };
  },
};
