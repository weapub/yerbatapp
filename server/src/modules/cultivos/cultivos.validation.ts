import { EstadoSanitario } from '@prisma/client';
import { z } from 'zod';
import { paginationSchema } from '../../shared/utils/pagination';

export const createCultivoSchema = z.object({
  campoId: z.string().uuid('campoId inválido'),
  nombre: z.string().min(2).max(120),
  variedad: z.string().max(120).optional(),
  fechaPlantacion: z.coerce.date(),
  cantidadPlantas: z.coerce.number().int().positive(),
  estadoSanitario: z.nativeEnum(EstadoSanitario).default(EstadoSanitario.BUENO),
  produccionEsperadaKg: z.coerce.number().positive().optional(),
});

export const updateCultivoSchema = createCultivoSchema.partial().omit({ campoId: true });

export const cultivoIdParamSchema = z.object({
  id: z.string().uuid('id inválido'),
});

export const listCultivosQuerySchema = paginationSchema.extend({
  campoId: z.string().uuid().optional(),
  estadoSanitario: z.nativeEnum(EstadoSanitario).optional(),
});

export const createHistorialSchema = z.object({
  evento: z.string().min(2).max(150),
  detalle: z.string().max(2000).optional(),
});

export type CreateCultivoInput = z.infer<typeof createCultivoSchema>;
export type UpdateCultivoInput = z.infer<typeof updateCultivoSchema>;
export type ListCultivosQuery = z.infer<typeof listCultivosQuerySchema>;
export type CreateHistorialInput = z.infer<typeof createHistorialSchema>;
