import { prisma } from '../../prisma/client';

export const dashboardRepository = {
  countCampos: (tenantId: string) => prisma.campo.count({ where: { tenantId } }),

  sumSuperficie: (tenantId: string) =>
    prisma.campo.aggregate({ where: { tenantId }, _sum: { superficieHa: true } }),

  countCultivos: (tenantId: string) => prisma.cultivo.count({ where: { campo: { tenantId } } }),

  cultivosPorEstadoSanitario: (tenantId: string) =>
    prisma.cultivo.groupBy({
      by: ['estadoSanitario'],
      where: { campo: { tenantId } },
      _count: { _all: true },
    }),

  camposPorEstado: (tenantId: string) =>
    prisma.campo.groupBy({ by: ['estado'], where: { tenantId }, _count: { _all: true } }),

  cultivosPorCampo: (tenantId: string) =>
    prisma.campo.findMany({
      where: { tenantId },
      select: { id: true, nombre: true, superficieHa: true, _count: { select: { cultivos: true } } },
      orderBy: { nombre: 'asc' },
    }),

  actividadReciente: (tenantId: string, take = 8) =>
    prisma.campoNota.findMany({
      where: { campo: { tenantId } },
      orderBy: { createdAt: 'desc' },
      take,
      include: { usuario: { select: { nombre: true } }, campo: { select: { nombre: true } } },
    }),
};
