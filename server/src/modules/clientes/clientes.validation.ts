import { z } from 'zod';
import { paginationSchema } from '../../shared/utils/pagination';

export const createClienteSchema = z.object({
  razonSocial: z.string().min(2).max(150),
  cuit: z.string().min(6).max(20),
  contacto: z.string().max(150).optional(),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().max(50).optional(),
  direccion: z.string().max(255).optional(),
});
export const updateClienteSchema = createClienteSchema.partial();
export const clienteIdParamSchema = z.object({ id: z.string().uuid('id inválido') });

export const listClientesQuerySchema = paginationSchema.extend({
  search: z.string().max(150).optional(),
});

export const movimientoCCClienteSchema = z.object({
  tipo: z.enum(['VENTA', 'COBRO']),
  monto: z.coerce.number().positive('Debe ser mayor a 0'),
  fecha: z.coerce.date().default(() => new Date()),
  descripcion: z.string().max(500).optional(),
});

export type CreateClienteInput = z.infer<typeof createClienteSchema>;
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;
export type ListClientesQuery = z.infer<typeof listClientesQuerySchema>;
export type MovimientoCCClienteInput = z.infer<typeof movimientoCCClienteSchema>;
