export type TipoTarea =
  | 'DESMALEZADO'
  | 'APLICACION_HERBICIDA'
  | 'APLICACION_FERTILIZANTE'
  | 'PODA'
  | 'CONTROL_PLAGAS'
  | 'LIMPIEZA'
  | 'COSECHA'
  | 'MANTENIMIENTO'
  | 'REPARACIONES'
  | 'RIEGO'
  | 'FERTILIZACION'
  | 'CONTROL_SANITARIO'
  | 'OTRO';

export type EstadoTarea = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA' | 'CANCELADA';
export type PrioridadTarea = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
export type Semaforo = 'ROJO' | 'AMARILLO' | 'VERDE' | null;

export interface TareaAdjunto {
  id: string;
  url: string;
  nombreArchivo: string;
  createdAt: string;
}

export interface Tarea {
  id: string;
  tipo: TipoTarea;
  campoId: string;
  campo: { id: string; nombre: string };
  cultivoId: string | null;
  cultivo: { id: string; nombre: string } | null;
  responsableId: string;
  responsable: { id: string; nombre: string };
  fechaProgramada: string;
  fechaRealizada: string | null;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  observaciones: string | null;
  semaforo: Semaforo;
  adjuntos: TareaAdjunto[];
  createdAt: string;
}

export const TIPO_TAREA_LABEL: Record<TipoTarea, string> = {
  DESMALEZADO: 'Desmalezado',
  APLICACION_HERBICIDA: 'Aplicación de herbicidas',
  APLICACION_FERTILIZANTE: 'Aplicación de fertilizantes',
  PODA: 'Poda',
  CONTROL_PLAGAS: 'Control de plagas',
  LIMPIEZA: 'Limpieza',
  COSECHA: 'Cosecha',
  MANTENIMIENTO: 'Mantenimiento',
  REPARACIONES: 'Reparaciones',
  RIEGO: 'Riego',
  FERTILIZACION: 'Fertilización',
  CONTROL_SANITARIO: 'Control sanitario',
  OTRO: 'Otro',
};
