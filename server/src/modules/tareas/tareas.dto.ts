import { Tarea, TareaAdjunto } from '@prisma/client';
import { calcularSemaforo } from './tareas.semaforo';

export const toTareaDto = (tarea: Tarea & { adjuntos?: TareaAdjunto[] }) => ({
  ...tarea,
  semaforo: calcularSemaforo(tarea),
});
