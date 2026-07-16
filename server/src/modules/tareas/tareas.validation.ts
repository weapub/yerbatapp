import { EstadoTarea, PrioridadTarea, TipoTarea } from '@prisma/client';
import { z } from 'zod';
import { paginationSchema } from '../../shared/utils/pagination';

export const createTareaSchema = z.object({
  tipo: z.nativeEnum(TipoTarea),
  campoId: z.string().uuid('campoId inválido'),
  cultivoId: z.string().uuid('cultivoId inválido').optional(),
  responsableId: z.string().uuid('responsableId inválido'),
  fechaProgramada: z.coerce.date(),
  prioridad: z.nativeEnum(PrioridadTarea).default(PrioridadTarea.MEDIA),
  observaciones: z.string().max(2000).optional(),
});

export const updateTareaSchema = z.object({
  tipo: z.nativeEnum(TipoTarea).optional(),
  cultivoId: z.string().uuid().optional(),
  responsableId: z.string().uuid().optional(),
  fechaProgramada: z.coerce.date().optional(),
  fechaRealizada: z.coerce.date().nullable().optional(),
  estado: z.nativeEnum(EstadoTarea).optional(),
  prioridad: z.nativeEnum(PrioridadTarea).optional(),
  observaciones: z.string().max(2000).optional(),
});

export const tareaIdParamSchema = z.object({
  id: z.string().uuid('id inválido'),
});

export const listTareasQuerySchema = paginationSchema.extend({
  campoId: z.string().uuid().optional(),
  cultivoId: z.string().uuid().optional(),
  responsableId: z.string().uuid().optional(),
  estado: z.nativeEnum(EstadoTarea).optional(),
  prioridad: z.nativeEnum(PrioridadTarea).optional(),
  tipo: z.nativeEnum(TipoTarea).optional(),
  semaforo: z.enum(['ROJO', 'AMARILLO', 'VERDE']).optional(),
});

export const calendarioQuerySchema = z.object({
  desde: z.coerce.date(),
  hasta: z.coerce.date(),
});

export type CreateTareaInput = z.infer<typeof createTareaSchema>;
export type UpdateTareaInput = z.infer<typeof updateTareaSchema>;
export type ListTareasQuery = z.infer<typeof listTareasQuerySchema>;
export type CalendarioQuery = z.infer<typeof calendarioQuerySchema>;
