import { Prisma, TipoInsumo } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { toSkipTake } from '../../shared/utils/pagination';
import { ListAplicacionesQuery } from './insumos.validation';

const include = {
  campo: { select: { nombre: true, superficieHa: true } },
  cultivo: { select: { nombre: true } },
  producto: { select: { nombre: true, marca: true } },
  proveedor: { select: { empresa: true } },
  aplicador: { select: { nombre: true } },
} satisfies Prisma.AplicacionInsumoInclude;

const buildWhere = (
  tenantId: string,
  query: Pick<ListAplicacionesQuery, 'tipo' | 'campoId' | 'cultivoId' | 'proveedorId'>,
): Prisma.AplicacionInsumoWhereInput => ({
  campo: { tenantId },
  ...(query.tipo ? { tipo: query.tipo } : {}),
  ...(query.campoId ? { campoId: query.campoId } : {}),
  ...(query.cultivoId ? { cultivoId: query.cultivoId } : {}),
  ...(query.proveedorId ? { proveedorId: query.proveedorId } : {}),
});

export const insumosRepository = {
  findManyPaginated: async (tenantId: string, query: ListAplicacionesQuery) => {
    const where = buildWhere(tenantId, query);
    const [data, total] = await Promise.all([
      prisma.aplicacionInsumo.findMany({ where, ...toSkipTake(query), orderBy: { fecha: 'desc' }, include }),
      prisma.aplicacionInsumo.count({ where }),
    ]);
    return { data, total };
  },

  findByIdInTenant: (id: string, tenantId: string) =>
    prisma.aplicacionInsumo.findFirst({ where: { id, campo: { tenantId } }, include }),

  findCampoInTenant: (campoId: string, tenantId: string) => prisma.campo.findFirst({ where: { id: campoId, tenantId } }),

  findCultivoInCampo: (cultivoId: string, campoId: string) =>
    prisma.cultivo.findFirst({ where: { id: cultivoId, campoId } }),

  findProductoInTenant: (productoId: string, proveedorId: string, tenantId: string) =>
    prisma.producto.findFirst({
      where: { id: productoId, proveedorId, proveedor: { tenantId } },
    }),

  findProveedorInTenant: (proveedorId: string, tenantId: string) =>
    prisma.proveedor.findFirst({ where: { id: proveedorId, tenantId } }),

  findUserInTenant: (userId: string, tenantId: string) => prisma.user.findFirst({ where: { id: userId, tenantId } }),

  create: (data: Prisma.AplicacionInsumoCreateInput) => prisma.aplicacionInsumo.create({ data, include }),

  update: (id: string, data: Prisma.AplicacionInsumoUpdateInput) =>
    prisma.aplicacionInsumo.update({ where: { id }, data, include }),

  delete: (id: string) => prisma.aplicacionInsumo.delete({ where: { id } }),

  findManyForStats: (tenantId: string, tipo: TipoInsumo, campoId?: string, cultivoId?: string) =>
    prisma.aplicacionInsumo.findMany({
      where: {
        campo: { tenantId },
        tipo,
        ...(campoId ? { campoId } : {}),
        ...(cultivoId ? { cultivoId } : {}),
      },
      select: {
        fecha: true,
        dosisHa: true,
        costo: true,
        cultivoId: true,
        cultivo: { select: { nombre: true } },
        campo: { select: { superficieHa: true } },
      },
    }),
};
