import { Factura } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError';
import { buildPaginationMeta, PaginatedResult } from '../../shared/utils/pagination';
import { clientesRepository } from '../clientes/clientes.repository';
import { proveedoresRepository } from '../proveedores/proveedores.repository';
import { toFacturaDto } from './facturas.dto';
import { facturasRepository } from './facturas.repository';
import { CreateFacturaInput, ListFacturasQuery, UpdateFacturaInput } from './facturas.validation';

const getFacturaOrThrow = async (id: string, tenantId: string) => {
  const factura = await facturasRepository.findByIdInTenant(id, tenantId);
  if (!factura) throw AppError.notFound('Factura no encontrada');
  return factura;
};

/**
 * Al emitir una factura, se genera automáticamente el movimiento de cuenta
 * corriente correspondiente (VENTA para el cliente, COMPRA para el proveedor),
 * enlazado por facturaId, para no tener que cargarlo dos veces.
 */
const generarMovimientoCuentaCorriente = async (factura: Factura) => {
  const monto = Number(factura.total);

  if (factura.operacion === 'VENTA' && factura.clienteId) {
    const ultimo = await clientesRepository.findUltimoMovimientoCC(factura.clienteId);
    const saldoAnterior = ultimo ? Number(ultimo.saldo) : 0;
    await clientesRepository.createMovimientoCC({
      cliente: { connect: { id: factura.clienteId } },
      factura: { connect: { id: factura.id } },
      monto,
      saldo: saldoAnterior + monto,
      fecha: factura.fecha,
      descripcion: `Factura ${factura.tipo}-${factura.numero}`,
    });
  } else if (factura.operacion === 'COMPRA' && factura.proveedorId) {
    const ultimo = await proveedoresRepository.findUltimoMovimientoCC(factura.proveedorId);
    const saldoAnterior = ultimo ? Number(ultimo.saldo) : 0;
    await proveedoresRepository.createMovimientoCC({
      proveedor: { connect: { id: factura.proveedorId } },
      factura: { connect: { id: factura.id } },
      monto,
      saldo: saldoAnterior + monto,
      fecha: factura.fecha,
      descripcion: `Factura ${factura.tipo}-${factura.numero}`,
    });
  }
};

export const facturasService = {
  async list(tenantId: string, query: ListFacturasQuery): Promise<PaginatedResult<ReturnType<typeof toFacturaDto>>> {
    const { data, total } = await facturasRepository.findManyPaginated(tenantId, query);
    return { data: data.map(toFacturaDto), meta: buildPaginationMeta(total, query) };
  },

  async getById(id: string, tenantId: string) {
    return toFacturaDto(await getFacturaOrThrow(id, tenantId));
  },

  async create(tenantId: string, input: CreateFacturaInput) {
    if (input.clienteId) {
      const cliente = await facturasRepository.findClienteInTenant(input.clienteId, tenantId);
      if (!cliente) throw AppError.notFound('Cliente no encontrado');
    }
    if (input.proveedorId) {
      const proveedor = await facturasRepository.findProveedorInTenant(input.proveedorId, tenantId);
      if (!proveedor) throw AppError.notFound('Proveedor no encontrado');
    }

    const total = Number((input.importeNeto + input.iva).toFixed(2));

    const factura = await facturasRepository.create({
      tipo: input.tipo,
      operacion: input.operacion,
      numero: input.numero,
      fecha: input.fecha,
      cae: input.cae,
      importeNeto: input.importeNeto,
      iva: input.iva,
      total,
      tenant: { connect: { id: tenantId } },
      ...(input.clienteId ? { cliente: { connect: { id: input.clienteId } } } : {}),
      ...(input.proveedorId ? { proveedor: { connect: { id: input.proveedorId } } } : {}),
    });

    await generarMovimientoCuentaCorriente(factura);

    return toFacturaDto(factura);
  },

  async update(id: string, tenantId: string, input: UpdateFacturaInput) {
    await getFacturaOrThrow(id, tenantId);
    const factura = await facturasRepository.update(id, input);
    return toFacturaDto(factura);
  },

  async delete(id: string, tenantId: string): Promise<void> {
    await getFacturaOrThrow(id, tenantId);
    await facturasRepository.delete(id);
  },

  async addAdjunto(id: string, tenantId: string, file: { url: string; nombreArchivo: string }) {
    await getFacturaOrThrow(id, tenantId);
    return facturasRepository.addAdjunto(id, file);
  },
};
