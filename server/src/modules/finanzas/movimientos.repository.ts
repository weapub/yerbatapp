import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { toSkipTake } from '../../shared/utils/pagination';
import { ListMovimientosQuery } from './finanzas.validation';

const include = {
  cuenta: { select: { id: true, nombre: true } },
  categoria: { select: { id: true, nombre: true } },
  centroCosto: { select: { id: true, nombre: true } },
  adjuntos: true,
} satisfies Prisma.MovimientoFinancieroInclude;

const buildWhere = (
  tenantId: string,
  query: Pick<ListMovimientosQuery, 'cuentaId' | 'categoriaId' | 'centroCostoId' | 'tipo' | 'desde' | 'hasta'>,
): Prisma.MovimientoFinancieroWhereInput => ({
  cuenta: { tenantId },
  ...(query.cuentaId ? { cuentaId: query.cuentaId } : {}),
  ...(query.categoriaId ? { categoriaId: query.categoriaId } : {}),
  ...(query.centroCostoId ? { centroCostoId: query.centroCostoId } : {}),
  ...(query.tipo ? { tipo: query.tipo } : {}),
  ...(query.desde || query.hasta
    ? { fecha: { ...(query.desde ? { gte: query.desde } : {}), ...(query.hasta ? { lte: query.hasta } : {}) } }
    : {}),
});

export const movimientosRepository = {
  findManyPaginated: async (tenantId: string, query: ListMovimientosQuery) => {
    const where = buildWhere(tenantId, query);
    const [data, total] = await Promise.all([
      prisma.movimientoFinanciero.findMany({ where, ...toSkipTake(query), orderBy: { fecha: 'desc' }, include }),
      prisma.movimientoFinanciero.count({ where }),
    ]);
    return { data, total };
  },

  findByIdInTenant: (id: string, tenantId: string) =>
    prisma.movimientoFinanciero.findFirst({ where: { id, cuenta: { tenantId } }, include }),

  findCuentaInTenant: (cuentaId: string, tenantId: string) =>
    prisma.cuentaFinanciera.findFirst({ where: { id: cuentaId, tenantId } }),

  findCategoriaInTenant: (categoriaId: string, tenantId: string) =>
    prisma.categoriaFinanciera.findFirst({ where: { id: categoriaId, tenantId } }),

  findCentroCostoInTenant: (centroCostoId: string, tenantId: string) =>
    prisma.centroCosto.findFirst({ where: { id: centroCostoId, tenantId } }),

  create: (data: Prisma.MovimientoFinancieroCreateInput) => prisma.movimientoFinanciero.create({ data, include }),

  update: (id: string, data: Prisma.MovimientoFinancieroUpdateInput) =>
    prisma.movimientoFinanciero.update({ where: { id }, data, include }),

  delete: (id: string) => prisma.movimientoFinanciero.delete({ where: { id } }),

  addAdjunto: (movimientoId: string, data: { url: string; nombreArchivo: string }) =>
    prisma.movimientoAdjunto.create({ data: { ...data, movimientoId } }),

  findManyForReporte: (tenantId: string, where: Prisma.MovimientoFinancieroWhereInput) =>
    prisma.movimientoFinanciero.findMany({
      where: { cuenta: { tenantId }, ...where },
      select: { fecha: true, monto: true, tipo: true, categoriaId: true, categoria: { select: { nombre: true } } },
    }),
};
