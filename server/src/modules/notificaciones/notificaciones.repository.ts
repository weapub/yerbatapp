import { Prisma, TipoNotificacion } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { toSkipTake } from '../../shared/utils/pagination';
import { ListNotificacionesQuery } from './notificaciones.validation';

export const notificacionesRepository = {
  findManyPaginated: async (userId: string, query: ListNotificacionesQuery) => {
    const where: Prisma.NotificacionWhereInput = {
      userId,
      ...(query.leida !== undefined ? { leida: query.leida } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.notificacion.findMany({ where, ...toSkipTake(query), orderBy: { createdAt: 'desc' } }),
      prisma.notificacion.count({ where }),
    ]);
    return { data, total };
  },

  countNoLeidas: (userId: string) => prisma.notificacion.count({ where: { userId, leida: false } }),

  findByIdForUser: (id: string, userId: string) => prisma.notificacion.findFirst({ where: { id, userId } }),

  marcarLeida: (id: string) => prisma.notificacion.update({ where: { id }, data: { leida: true } }),

  marcarTodasLeidas: (userId: string) =>
    prisma.notificacion.updateMany({ where: { userId, leida: false }, data: { leida: true } }),

  create: (data: Prisma.NotificacionCreateInput) => prisma.notificacion.create({ data }),

  /** Evita notificar dos veces la misma entidad en un lapso corto (ej. corridas diarias del cron). */
  existeNotificacionReciente: async (userId: string, entidadTipo: string, entidadId: string, desde: Date) => {
    const existente = await prisma.notificacion.findFirst({
      where: { userId, entidadTipo, entidadId, createdAt: { gte: desde } },
      select: { id: true },
    });
    return Boolean(existente);
  },

  findTenantsActivos: () => prisma.tenant.findMany({ where: { activo: true }, select: { id: true } }),

  findAdminsDeTenant: (tenantId: string) =>
    prisma.user.findMany({ where: { tenantId, rol: 'ADMIN', activo: true }, select: { id: true } }),

  findTareasAbiertasConAlerta: (tenantId: string) =>
    prisma.tarea.findMany({
      where: { tenantId, estado: { notIn: ['COMPLETADA', 'CANCELADA'] } },
      select: {
        id: true,
        tipo: true,
        fechaProgramada: true,
        prioridad: true,
        estado: true,
        responsableId: true,
        campo: { select: { nombre: true } },
      },
    }),

  findFacturasPendientes: (tenantId: string) =>
    prisma.factura.findMany({
      where: { tenantId, estado: 'PENDIENTE' },
      select: { id: true, tipo: true, numero: true, fecha: true, total: true },
    }),

  marcarFacturaVencida: (id: string) => prisma.factura.update({ where: { id }, data: { estado: 'VENCIDA' } }),
};

export type { TipoNotificacion };
