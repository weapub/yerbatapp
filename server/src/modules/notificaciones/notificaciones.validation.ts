import { z } from 'zod';
import { paginationSchema } from '../../shared/utils/pagination';

export const listNotificacionesQuerySchema = paginationSchema.extend({
  leida: z.coerce.boolean().optional(),
});

export const notificacionIdParamSchema = z.object({ id: z.string().uuid('id inválido') });

export type ListNotificacionesQuery = z.infer<typeof listNotificacionesQuerySchema>;
