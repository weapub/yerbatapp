import { TipoInsumo } from '@prisma/client';
import { z } from 'zod';
import { paginationSchema } from '../../shared/utils/pagination';

export const createAplicacionSchema = z.object({
  campoId: z.string().uuid('campoId inválido'),
  cultivoId: z.string().uuid('cultivoId inválido'),
  productoId: z.string().uuid('productoId inválido'),
  proveedorId: z.string().uuid('proveedorId inválido'),
  fecha: z.coerce.date(),
  dosisHa: z.coerce.number().positive('Debe ser mayor a 0'),
  cantidadUtilizada: z.coerce.number().positive('Debe ser mayor a 0'),
  costo: z.coerce.number().nonnegative(),
  aplicadorId: z.string().uuid('aplicadorId inválido'),
  observaciones: z.string().max(2000).optional(),
});

export const updateAplicacionSchema = createAplicacionSchema.partial().omit({
  campoId: true,
  cultivoId: true,
  productoId: true,
  proveedorId: true,
});

export const aplicacionIdParamSchema = z.object({
  id: z.string().uuid('id inválido'),
});

export const listAplicacionesQuerySchema = paginationSchema.extend({
  tipo: z.nativeEnum(TipoInsumo).optional(),
  campoId: z.string().uuid().optional(),
  cultivoId: z.string().uuid().optional(),
  proveedorId: z.string().uuid().optional(),
});

export const estadisticasQuerySchema = z.object({
  tipo: z.nativeEnum(TipoInsumo),
  campoId: z.string().uuid().optional(),
  cultivoId: z.string().uuid().optional(),
});

export type CreateAplicacionInput = z.infer<typeof createAplicacionSchema>;
export type UpdateAplicacionInput = z.infer<typeof updateAplicacionSchema>;
export type ListAplicacionesQuery = z.infer<typeof listAplicacionesQuerySchema>;
export type EstadisticasQuery = z.infer<typeof estadisticasQuerySchema>;
