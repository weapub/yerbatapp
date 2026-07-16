import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { toSkipTake } from '../../shared/utils/pagination';
import { ListClientesQuery } from './clientes.validation';

const buildWhere = (tenantId: string, query: Pick<ListClientesQuery, 'search'>): Prisma.ClienteWhereInput => ({
  tenantId,
  ...(query.search
    ? {
        OR: [
          { razonSocial: { contains: query.search, mode: 'insensitive' } },
          { cuit: { contains: query.search, mode: 'insensitive' } },
        ],
      }
    : {}),
});

export const clientesRepository = {
  findManyPaginated: async (tenantId: string, query: ListClientesQuery) => {
    const where = buildWhere(tenantId, query);
    const [data, total] = await Promise.all([
      prisma.cliente.findMany({ where, ...toSkipTake(query), orderBy: { razonSocial: 'asc' } }),
      prisma.cliente.count({ where }),
    ]);
    return { data, total };
  },

  findByIdInTenant: (id: string, tenantId: string) => prisma.cliente.findFirst({ where: { id, tenantId } }),

  create: (data: Prisma.ClienteCreateInput) => prisma.cliente.create({ data }),

  update: (id: string, data: Prisma.ClienteUpdateInput) => prisma.cliente.update({ where: { id }, data }),

  delete: (id: string) => prisma.cliente.delete({ where: { id } }),

  // Ordenado por createdAt (orden real de inserción), no por fecha: "fecha" es la fecha de
  // negocio y el usuario puede cargar movimientos con fecha retroactiva, lo que rompería el
  // encadenamiento de saldos si se usara como criterio de "último movimiento".
  findUltimoMovimientoCC: (clienteId: string) =>
    prisma.movimientoCuentaCorriente.findFirst({ where: { clienteId }, orderBy: { createdAt: 'desc' } }),

  findMovimientosCC: (clienteId: string) =>
    prisma.movimientoCuentaCorriente.findMany({ where: { clienteId }, orderBy: { fecha: 'desc' } }),

  createMovimientoCC: (data: Prisma.MovimientoCuentaCorrienteCreateInput) =>
    prisma.movimientoCuentaCorriente.create({ data }),

  sumVentas: (clienteId: string) =>
    prisma.movimientoCuentaCorriente.aggregate({
      where: { clienteId, monto: { gt: 0 } },
      _sum: { monto: true },
    }),
};
