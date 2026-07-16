import { z } from 'zod';

export const createCampaniaSchema = z
  .object({
    nombre: z.string().min(2).max(50),
    fechaInicio: z.coerce.date(),
    fechaFin: z.coerce.date(),
  })
  .refine((data) => data.fechaFin > data.fechaInicio, {
    message: 'fechaFin debe ser posterior a fechaInicio',
    path: ['fechaFin'],
  });

export const updateCampaniaSchema = z.object({
  nombre: z.string().min(2).max(50).optional(),
  fechaInicio: z.coerce.date().optional(),
  fechaFin: z.coerce.date().optional(),
});

export const campaniaIdParamSchema = z.object({
  id: z.string().uuid('id inválido'),
});

export type CreateCampaniaInput = z.infer<typeof createCampaniaSchema>;
export type UpdateCampaniaInput = z.infer<typeof updateCampaniaSchema>;
