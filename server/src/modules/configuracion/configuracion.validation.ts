import { z } from 'zod';

export const updateEmpresaSchema = z.object({
  razonSocial: z.string().min(2).max(150).optional(),
  cuit: z.string().max(20).optional(),
  direccion: z.string().max(255).optional(),
  telefono: z.string().max(50).optional(),
  ivaGeneral: z.coerce.number().min(0).max(100).optional(),
});

export const parametroClaveParamSchema = z.object({
  clave: z.string().min(1).max(100),
});

export const upsertParametroSchema = z.object({
  valor: z.string().min(1).max(1000),
});

export type UpdateEmpresaInput = z.infer<typeof updateEmpresaSchema>;
export type UpsertParametroInput = z.infer<typeof upsertParametroSchema>;
