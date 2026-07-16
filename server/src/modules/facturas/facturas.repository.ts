import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { toSkipTake } from '../../shared/utils/pagination';
import { ListFacturasQuery } from './facturas.validation';

const include = {
  cliente: { select: { id: true, razonSocial: true } },
  proveedor: { select: { id: true, empresa: true } },
  adjuntos: true,
} satisfies Prisma.FacturaInclude;

const buildWhere = (
  tenantId: string,
  query: Pick<ListFacturasQuery, 'operacion' | 'estado' | 'tipo' | 'clienteId' | 'proveedorId' | 'desde' | 'hasta'>,
): Prisma.FacturaWhereInput => ({
  tenantId,
  ...(query.operacion ? { operacion: query.operacion } : {}),
  ...(query.estado ? { estado: query.estado } : {}),
  ...(query.tipo ? { tipo: query.tipo } : {}),
  ...(query.clienteId ? { clienteId: query.clienteId } : {}),
  ...(query.proveedorId ? { proveedorId: query.proveedorId } : {}),
  ...(query.desde || query.hasta
    ? { fecha: { ...(query.desde ? { gte: query.desde } : {}), ...(query.hasta ? { lte: query.hasta } : {}) } }
    : {}),
});

export const facturasRepository = {
  findManyPaginated: async (tenantId: string, query: ListFacturasQuery) => {
    const where = buildWhere(tenantId, query);
    const [data, total] = await Promise.all([
      prisma.factura.findMany({ where, ...toSkipTake(query), orderBy: { fecha: 'desc' }, include }),
      prisma.factura.count({ where }),
    ]);
    return { data, total };
  },

  findByIdInTenant: (id: string, tenantId: string) => prisma.factura.findFirst({ where: { id, tenantId }, include }),

  findClienteInTenant: (clienteId: string, tenantId: string) => prisma.cliente.findFirst({ where: { id: clienteId, tenantId } }),

  findProveedorInTenant: (proveedorId: string, tenantId: string) =>
    prisma.proveedor.findFirst({ where: { id: proveedorId, tenantId } }),

  create: (data: Prisma.FacturaCreateInput) => prisma.factura.create({ data, include }),

  update: (id: string, data: Prisma.FacturaUpdateInput) => prisma.factura.update({ where: { id }, data, include }),

  delete: (id: string) => prisma.factura.delete({ where: { id } }),

  addAdjunto: (facturaId: string, data: { url: string; nombreArchivo: string }) =>
    prisma.facturaAdjunto.create({ data: { ...data, facturaId } }),

  findManyForIva: (tenantId: string, desde: Date, hasta: Date) =>
    prisma.factura.findMany({
      where: { tenantId, fecha: { gte: desde, lte: hasta }, estado: { not: 'ANULADA' } },
      select: { fecha: true, operacion: true, iva: true, importeNeto: true, total: true, tipo: true, numero: true },
      orderBy: { fecha: 'asc' },
    }),
};
