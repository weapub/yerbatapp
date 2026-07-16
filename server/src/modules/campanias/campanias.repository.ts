import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';

export const campaniasRepository = {
  findManyByTenant: (tenantId: string) =>
    prisma.campania.findMany({
      where: { tenantId },
      orderBy: { fechaInicio: 'desc' },
      include: { _count: { select: { rendimientos: true } } },
    }),

  findByIdInTenant: (id: string, tenantId: string) => prisma.campania.findFirst({ where: { id, tenantId } }),

  create: (data: Prisma.CampaniaCreateInput) => prisma.campania.create({ data }),

  update: (id: string, data: Prisma.CampaniaUpdateInput) => prisma.campania.update({ where: { id }, data }),

  delete: (id: string) => prisma.campania.delete({ where: { id } }),
};
