import { EstadoTarea, Prisma, PrioridadTarea } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { toSkipTake } from '../../shared/utils/pagination';
import { hoyUTC } from '../../shared/utils/date';
import { ListTareasQuery } from './tareas.validation';

const ESTADOS_CERRADOS: EstadoTarea[] = [EstadoTarea.COMPLETADA, EstadoTarea.CANCELADA];
const PRIORIDADES_URGENTES: PrioridadTarea[] = [PrioridadTarea.URGENTE, PrioridadTarea.ALTA];
const DIAS_PROXIMO_A_VENCER = 3;

const semaforoWhere = (semaforo: NonNullable<ListTareasQuery['semaforo']>): Prisma.TareaWhereInput => {
  const hoy = hoyUTC();
  const limiteAmarillo = new Date(hoy);
  limiteAmarillo.setUTCDate(limiteAmarillo.getUTCDate() + DIAS_PROXIMO_A_VENCER + 1); // exclusivo

  const abierta: Prisma.TareaWhereInput = { estado: { notIn: ESTADOS_CERRADOS } };

  if (semaforo === 'ROJO') {
    return {
      ...abierta,
      OR: [{ fechaProgramada: { lt: hoy } }, { prioridad: { in: PRIORIDADES_URGENTES } }],
    };
  }

  if (semaforo === 'AMARILLO') {
    return {
      ...abierta,
      prioridad: { notIn: PRIORIDADES_URGENTES },
      fechaProgramada: { gte: hoy, lt: limiteAmarillo },
    };
  }

  // VERDE
  return {
    ...abierta,
    prioridad: { notIn: PRIORIDADES_URGENTES },
    fechaProgramada: { gte: limiteAmarillo },
  };
};

const buildWhere = (tenantId: string, query: ListTareasQuery): Prisma.TareaWhereInput => ({
  tenantId,
  ...(query.campoId ? { campoId: query.campoId } : {}),
  ...(query.cultivoId ? { cultivoId: query.cultivoId } : {}),
  ...(query.responsableId ? { responsableId: query.responsableId } : {}),
  ...(query.estado ? { estado: query.estado } : {}),
  ...(query.prioridad ? { prioridad: query.prioridad } : {}),
  ...(query.tipo ? { tipo: query.tipo } : {}),
  ...(query.semaforo ? semaforoWhere(query.semaforo) : {}),
});

const include = {
  campo: { select: { id: true, nombre: true } },
  cultivo: { select: { id: true, nombre: true } },
  responsable: { select: { id: true, nombre: true } },
  adjuntos: true,
} satisfies Prisma.TareaInclude;

export const tareasRepository = {
  findManyPaginated: async (tenantId: string, query: ListTareasQuery) => {
    const where = buildWhere(tenantId, query);
    const [data, total] = await Promise.all([
      prisma.tarea.findMany({
        where,
        ...toSkipTake(query),
        orderBy: [{ fechaProgramada: 'asc' }],
        include,
      }),
      prisma.tarea.count({ where }),
    ]);
    return { data, total };
  },

  findByIdInTenant: (id: string, tenantId: string) => prisma.tarea.findFirst({ where: { id, tenantId }, include }),

  findCampoInTenant: (campoId: string, tenantId: string) => prisma.campo.findFirst({ where: { id: campoId, tenantId } }),

  findCultivoInCampo: (cultivoId: string, campoId: string) =>
    prisma.cultivo.findFirst({ where: { id: cultivoId, campoId } }),

  findUserInTenant: (userId: string, tenantId: string) => prisma.user.findFirst({ where: { id: userId, tenantId } }),

  create: (data: Prisma.TareaCreateInput) => prisma.tarea.create({ data, include }),

  update: (id: string, data: Prisma.TareaUpdateInput) => prisma.tarea.update({ where: { id }, data, include }),

  delete: (id: string) => prisma.tarea.delete({ where: { id } }),

  addAdjunto: (tareaId: string, data: { url: string; nombreArchivo: string }) =>
    prisma.tareaAdjunto.create({ data: { ...data, tareaId } }),

  findCalendario: (tenantId: string, desde: Date, hasta: Date) =>
    prisma.tarea.findMany({
      where: { tenantId, fechaProgramada: { gte: desde, lte: hasta } },
      orderBy: { fechaProgramada: 'asc' },
      include,
    }),

  countPendientesYAlertas: async (tenantId: string) => {
    const hoy = hoyUTC();

    const [pendientes, vencidas] = await Promise.all([
      prisma.tarea.count({ where: { tenantId, estado: { notIn: ESTADOS_CERRADOS } } }),
      prisma.tarea.count({
        where: {
          tenantId,
          estado: { notIn: ESTADOS_CERRADOS },
          OR: [{ fechaProgramada: { lt: hoy } }, { prioridad: { in: PRIORIDADES_URGENTES } }],
        },
      }),
    ]);

    return { pendientes, alertas: vencidas };
  },
};
