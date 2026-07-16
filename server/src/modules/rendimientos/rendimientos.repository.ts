import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { toSkipTake } from '../../shared/utils/pagination';
import { ListRendimientosQuery } from './rendimientos.validation';

const buildWhere = (
  tenantId: string,
  query: Pick<ListRendimientosQuery, 'campoId' | 'cultivoId' | 'campaniaId'>,
): Prisma.RendimientoWhereInput => ({
  campo: { tenantId },
  ...(query.campoId ? { campoId: query.campoId } : {}),
  ...(query.cultivoId ? { cultivoId: query.cultivoId } : {}),
  ...(query.campaniaId ? { campaniaId: query.campaniaId } : {}),
});

export const rendimientosRepository = {
  findManyPaginated: async (tenantId: string, query: ListRendimientosQuery) => {
    const where = buildWhere(tenantId, query);
    const [data, total] = await Promise.all([
      prisma.rendimiento.findMany({
        where,
        ...toSkipTake(query),
        orderBy: { fecha: 'desc' },
        include: {
          campo: { select: { nombre: true, superficieHa: true } },
          cultivo: { select: { nombre: true } },
          campania: { select: { nombre: true } },
        },
      }),
      prisma.rendimiento.count({ where }),
    ]);
    return { data, total };
  },

  findByIdInTenant: (id: string, tenantId: string) =>
    prisma.rendimiento.findFirst({
      where: { id, campo: { tenantId } },
      include: {
        campo: { select: { nombre: true, superficieHa: true } },
        cultivo: { select: { nombre: true } },
        campania: { select: { nombre: true } },
      },
    }),

  findCampoInTenant: (campoId: string, tenantId: string) => prisma.campo.findFirst({ where: { id: campoId, tenantId } }),

  findCultivoInCampo: (cultivoId: string, campoId: string) =>
    prisma.cultivo.findFirst({ where: { id: cultivoId, campoId } }),

  findCampaniaInTenant: (campaniaId: string, tenantId: string) =>
    prisma.campania.findFirst({ where: { id: campaniaId, tenantId } }),

  create: (data: Prisma.RendimientoCreateInput) => prisma.rendimiento.create({ data }),

  update: (id: string, data: Prisma.RendimientoUpdateInput) => prisma.rendimiento.update({ where: { id }, data }),

  delete: (id: string) => prisma.rendimiento.delete({ where: { id } }),

  groupByCampo: (where: Prisma.RendimientoWhereInput) =>
    prisma.rendimiento.groupBy({
      by: ['campoId'],
      where,
      _sum: { produccion: true, costo: true, ingreso: true },
      _avg: { rendimientoHa: true },
    }),

  groupByCultivo: (where: Prisma.RendimientoWhereInput) =>
    prisma.rendimiento.groupBy({
      by: ['cultivoId'],
      where,
      _sum: { produccion: true, costo: true, ingreso: true },
      _avg: { rendimientoHa: true },
    }),

  groupByCampania: (where: Prisma.RendimientoWhereInput) =>
    prisma.rendimiento.groupBy({
      by: ['campaniaId'],
      where,
      _sum: { produccion: true, costo: true, ingreso: true },
      _avg: { rendimientoHa: true },
    }),

  findCamposByIds: (ids: string[]) => prisma.campo.findMany({ where: { id: { in: ids } }, select: { id: true, nombre: true } }),
  findCultivosByIds: (ids: string[]) =>
    prisma.cultivo.findMany({ where: { id: { in: ids } }, select: { id: true, nombre: true } }),
  findCampaniasByIds: (ids: string[]) =>
    prisma.campania.findMany({ where: { id: { in: ids } }, select: { id: true, nombre: true } }),
};
