import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ListCamposQuery } from './campos.validation';
import { toSkipTake } from '../../shared/utils/pagination';

const buildWhere = (tenantId: string, query: Pick<ListCamposQuery, 'estado' | 'search'>): Prisma.CampoWhereInput => ({
  tenantId,
  ...(query.estado ? { estado: query.estado } : {}),
  ...(query.search
    ? {
        OR: [
          { nombre: { contains: query.search, mode: 'insensitive' } },
          { ubicacion: { contains: query.search, mode: 'insensitive' } },
        ],
      }
    : {}),
});

export const camposRepository = {
  findManyPaginated: async (tenantId: string, query: ListCamposQuery) => {
    const where = buildWhere(tenantId, query);
    const [data, total] = await Promise.all([
      prisma.campo.findMany({
        where,
        ...toSkipTake(query),
        orderBy: { createdAt: 'desc' },
        include: { responsable: { select: { id: true, nombre: true } }, _count: { select: { cultivos: true } } },
      }),
      prisma.campo.count({ where }),
    ]);
    return { data, total };
  },

  findByIdInTenant: (id: string, tenantId: string) =>
    prisma.campo.findFirst({
      where: { id, tenantId },
      include: {
        responsable: { select: { id: true, nombre: true } },
        cultivos: true,
        _count: { select: { notas: true, documentos: true, fotos: true, tareas: true } },
      },
    }),

  create: (data: Prisma.CampoCreateInput) => prisma.campo.create({ data }),

  update: (id: string, data: Prisma.CampoUpdateInput) => prisma.campo.update({ where: { id }, data }),

  delete: (id: string) => prisma.campo.delete({ where: { id } }),

  // ── Notas ──
  findNotasByCampo: (campoId: string) =>
    prisma.campoNota.findMany({
      where: { campoId },
      orderBy: { createdAt: 'desc' },
      include: { usuario: { select: { id: true, nombre: true } }, adjuntos: true },
    }),

  createNota: (data: Prisma.CampoNotaCreateInput) =>
    prisma.campoNota.create({ data, include: { adjuntos: true } }),

  findNotaInCampo: (notaId: string, campoId: string) =>
    prisma.campoNota.findFirst({ where: { id: notaId, campoId } }),

  addNotaAdjunto: (notaId: string, data: { url: string; nombreArchivo: string; mimeType: string }) =>
    prisma.campoNotaAdjunto.create({ data: { ...data, notaId } }),

  // ── Documentos ──
  findDocumentosByCampo: (campoId: string) =>
    prisma.campoDocumento.findMany({ where: { campoId }, orderBy: { createdAt: 'desc' } }),

  createDocumento: (data: Prisma.CampoDocumentoCreateInput) => prisma.campoDocumento.create({ data }),

  // ── Fotos ──
  findFotosByCampo: (campoId: string) =>
    prisma.campoFoto.findMany({ where: { campoId }, orderBy: { createdAt: 'desc' } }),

  createFoto: (data: Prisma.CampoFotoCreateInput) => prisma.campoFoto.create({ data }),
};
