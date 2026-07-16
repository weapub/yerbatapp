import { UnidadProduccion } from '@prisma/client';
import { z } from 'zod';
import { paginationSchema } from '../../shared/utils/pagination';

export const createRendimientoSchema = z.object({
  campoId: z.string().uuid('campoId inválido'),
  cultivoId: z.string().uuid('cultivoId inválido'),
  campaniaId: z.string().uuid('campaniaId inválido'),
  fecha: z.coerce.date(),
  produccion: z.coerce.number().positive('Debe ser mayor a 0'),
  unidad: z.nativeEnum(UnidadProduccion).default(UnidadProduccion.KG),
  costo: z.coerce.number().nonnegative().default(0),
  ingreso: z.coerce.number().nonnegative().default(0),
});

export const updateRendimientoSchema = createRendimientoSchema.partial().omit({
  campoId: true,
  cultivoId: true,
  campaniaId: true,
});

export const rendimientoIdParamSchema = z.object({
  id: z.string().uuid('id inválido'),
});

export const listRendimientosQuerySchema = paginationSchema.extend({
  campoId: z.string().uuid().optional(),
  cultivoId: z.string().uuid().optional(),
  campaniaId: z.string().uuid().optional(),
});

export const comparativaQuerySchema = z.object({
  groupBy: z.enum(['campo', 'cultivo', 'campania']).default('campania'),
  campaniaId: z.string().uuid().optional(),
  campoId: z.string().uuid().optional(),
  cultivoId: z.string().uuid().optional(),
});

export type CreateRendimientoInput = z.infer<typeof createRendimientoSchema>;
export type UpdateRendimientoInput = z.infer<typeof updateRendimientoSchema>;
export type ListRendimientosQuery = z.infer<typeof listRendimientosQuerySchema>;
export type ComparativaQuery = z.infer<typeof comparativaQuerySchema>;
