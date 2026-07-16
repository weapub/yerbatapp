import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { toSkipTake } from '../../shared/utils/pagination';
import { ListProveedoresQuery } from './proveedores.validation';

const buildWhere = (tenantId: string, query: Pick<ListProveedoresQuery, 'search'>): Prisma.ProveedorWhereInput => ({
  tenantId,
  ...(query.search
    ? {
        OR: [
          { empresa: { contains: query.search, mode: 'insensitive' } },
          { cuit: { contains: query.search, mode: 'insensitive' } },
        ],
      }
    : {}),
});

export const proveedoresRepository = {
  findManyPaginated: async (tenantId: string, query: ListProveedoresQuery) => {
    const where = buildWhere(tenantId, query);
    const [data, total] = await Promise.all([
      prisma.proveedor.findMany({
        where,
        ...toSkipTake(query),
        orderBy: { empresa: 'asc' },
        include: { _count: { select: { productos: true, aplicaciones: true } } },
      }),
      prisma.proveedor.count({ where }),
    ]);
    return { data, total };
  },

  findByIdInTenant: (id: string, tenantId: string) =>
    prisma.proveedor.findFirst({
      where: { id, tenantId },
      include: { productos: { orderBy: { nombre: 'asc' } }, _count: { select: { aplicaciones: true } } },
    }),

  create: (data: Prisma.ProveedorCreateInput) => prisma.proveedor.create({ data }),

  update: (id: string, data: Prisma.ProveedorUpdateInput) => prisma.proveedor.update({ where: { id }, data }),

  delete: (id: string) => prisma.proveedor.delete({ where: { id } }),

  createProducto: (proveedorId: string, data: { nombre: string; marca?: string; tipo: Prisma.ProductoCreateInput['tipo'] }) =>
    prisma.producto.create({ data: { ...data, proveedor: { connect: { id: proveedorId } } } }),

  findAplicacionesByProveedor: (proveedorId: string) =>
    prisma.aplicacionInsumo.findMany({
      where: { proveedorId },
      orderBy: { fecha: 'desc' },
      include: {
        campo: { select: { nombre: true } },
        cultivo: { select: { nombre: true } },
        producto: { select: { nombre: true, marca: true, tipo: true } },
      },
    }),

  // Ordenado por createdAt (orden real de inserción), no por fecha: ver nota en
  // clientes.repository.ts — evita romper el encadenamiento de saldos con cargas retroactivas.
  findUltimoMovimientoCC: (proveedorId: string) =>
    prisma.movimientoCuentaCorriente.findFirst({ where: { proveedorId }, orderBy: { createdAt: 'desc' } }),

  findMovimientosCC: (proveedorId: string) =>
    prisma.movimientoCuentaCorriente.findMany({ where: { proveedorId }, orderBy: { fecha: 'desc' } }),

  createMovimientoCC: (data: Prisma.MovimientoCuentaCorrienteCreateInput) =>
    prisma.movimientoCuentaCorriente.create({ data }),

  sumCompras: (proveedorId: string) =>
    prisma.movimientoCuentaCorriente.aggregate({
      where: { proveedorId, monto: { gt: 0 } },
      _sum: { monto: true },
    }),
};
