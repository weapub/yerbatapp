import { EstadoCampo } from '@prisma/client';
import { z } from 'zod';
import { paginationSchema } from '../../shared/utils/pagination';

export const createCampoSchema = z.object({
  nombre: z.string().min(2).max(150),
  ubicacion: z.string().min(2).max(255),
  superficieHa: z.coerce.number().positive('La superficie debe ser mayor a 0'),
  latitud: z.coerce.number().min(-90).max(90).optional(),
  longitud: z.coerce.number().min(-180).max(180).optional(),
  responsableId: z.string().uuid().optional(),
  estado: z.nativeEnum(EstadoCampo).default(EstadoCampo.ACTIVO),
  observaciones: z.string().max(2000).optional(),
});

export const updateCampoSchema = createCampoSchema.partial();

export const campoIdParamSchema = z.object({
  id: z.string().uuid('id inválido'),
});

export const listCamposQuerySchema = paginationSchema.extend({
  estado: z.nativeEnum(EstadoCampo).optional(),
  search: z.string().max(150).optional(),
});

export const createNotaSchema = z.object({
  titulo: z.string().min(2).max(150),
  descripcion: z.string().min(1).max(5000),
});

export const notaIdParamSchema = z.object({
  id: z.string().uuid('id de campo inválido'),
  notaId: z.string().uuid('id de nota inválido'),
});

export const fotoDescripcionSchema = z.object({
  descripcion: z.string().max(255).optional(),
});

export type CreateCampoInput = z.infer<typeof createCampoSchema>;
export type UpdateCampoInput = z.infer<typeof updateCampoSchema>;
export type ListCamposQuery = z.infer<typeof listCamposQuerySchema>;
export type CreateNotaInput = z.infer<typeof createNotaSchema>;
