import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { toSkipTake } from '../../shared/utils/pagination';
import { ListCultivosQuery } from './cultivos.validation';

const buildWhere = (
  tenantId: string,
  query: Pick<ListCultivosQuery, 'campoId' | 'estadoSanitario'>,
): Prisma.CultivoWhereInput => ({
  campo: { tenantId },
  ...(query.campoId ? { campoId: query.campoId } : {}),
  ...(query.estadoSanitario ? { estadoSanitario: query.estadoSanitario } : {}),
});

export const cultivosRepository = {
  findManyPaginated: async (tenantId: string, query: ListCultivosQuery) => {
    const where = buildWhere(tenantId, query);
    const [data, total] = await Promise.all([
      prisma.cultivo.findMany({
        where,
        ...toSkipTake(query),
        orderBy: { createdAt: 'desc' },
        include: { campo: { select: { id: true, nombre: true } } },
      }),
      prisma.cultivo.count({ where }),
    ]);
    return { data, total };
  },

  findByIdInTenant: (id: string, tenantId: string) =>
    prisma.cultivo.findFirst({
      where: { id, campo: { tenantId } },
      include: { campo: { select: { id: true, nombre: true, tenantId: true } }, historial: { orderBy: { fecha: 'desc' } } },
    }),

  findCampoInTenant: (campoId: string, tenantId: string) => prisma.campo.findFirst({ where: { id: campoId, tenantId } }),

  create: (data: Prisma.CultivoCreateInput) => prisma.cultivo.create({ data }),

  update: (id: string, data: Prisma.CultivoUpdateInput) => prisma.cultivo.update({ where: { id }, data }),

  delete: (id: string) => prisma.cultivo.delete({ where: { id } }),

  createHistorial: (cultivoId: string, data: { evento: string; detalle?: string }) =>
    prisma.cultivoHistorial.create({ data: { ...data, cultivoId } }),
};
