import { z } from 'zod';

export const backupIdParamSchema = z.object({ id: z.string().uuid('id inválido') });

export const restaurarBackupSchema = z.object({
  confirmar: z.literal('RESTAURAR', {
    errorMap: () => ({ message: 'Debés enviar { "confirmar": "RESTAURAR" } para confirmar esta operación destructiva' }),
  }),
});

export type RestaurarBackupInput = z.infer<typeof restaurarBackupSchema>;
