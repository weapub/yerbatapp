import { TipoInsumo } from '@prisma/client';
import { z } from 'zod';
import { paginationSchema } from '../../shared/utils/pagination';

export const createProveedorSchema = z.object({
  empresa: z.string().min(2).max(150),
  cuit: z.string().min(6).max(20),
  contacto: z.string().max(150).optional(),
  direccion: z.string().max(255).optional(),
  telefono: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal('')),
});

export const updateProveedorSchema = createProveedorSchema.partial();

export const proveedorIdParamSchema = z.object({
  id: z.string().uuid('id inválido'),
});

export const listProveedoresQuerySchema = paginationSchema.extend({
  search: z.string().max(150).optional(),
});

export const createProductoSchema = z.object({
  nombre: z.string().min(2).max(150),
  marca: z.string().max(100).optional(),
  tipo: z.nativeEnum(TipoInsumo),
});

export const movimientoCCProveedorSchema = z.object({
  tipo: z.enum(['COMPRA', 'PAGO']),
  monto: z.coerce.number().positive('Debe ser mayor a 0'),
  fecha: z.coerce.date().default(() => new Date()),
  descripcion: z.string().max(500).optional(),
});

export type CreateProveedorInput = z.infer<typeof createProveedorSchema>;
export type UpdateProveedorInput = z.infer<typeof updateProveedorSchema>;
export type ListProveedoresQuery = z.infer<typeof listProveedoresQuerySchema>;
export type CreateProductoInput = z.infer<typeof createProductoSchema>;
export type MovimientoCCProveedorInput = z.infer<typeof movimientoCCProveedorSchema>;
