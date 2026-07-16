import { EstadoTarea, PrioridadTarea } from '@prisma/client';
import { aFechaUTC, hoyUTC } from '../../shared/utils/date';

export type Semaforo = 'ROJO' | 'AMARILLO' | 'VERDE' | null;

/** Ventana de días para considerar una tarea "próxima a vencer" (amarillo). */
const DIAS_PROXIMO_A_VENCER = 3;

/**
 * Sistema tipo semáforo:
 *  🔴 ROJO: vencida, prioridad alta o urgente
 *  🟡 AMARILLO: próxima a vencer (dentro de los próximos DIAS_PROXIMO_A_VENCER días)
 *  🟢 VERDE: en tiempo
 * Las tareas completadas o canceladas no llevan color (ya no son urgentes).
 */
export const calcularSemaforo = (tarea: {
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  fechaProgramada: Date;
}): Semaforo => {
  if (tarea.estado === 'COMPLETADA' || tarea.estado === 'CANCELADA') return null;

  const hoy = hoyUTC();
  const fechaProgramada = aFechaUTC(tarea.fechaProgramada);

  const diffDias = Math.round((fechaProgramada.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return 'ROJO';
  if (tarea.prioridad === 'URGENTE' || tarea.prioridad === 'ALTA') return 'ROJO';
  if (diffDias <= DIAS_PROXIMO_A_VENCER) return 'AMARILLO';
  return 'VERDE';
};
