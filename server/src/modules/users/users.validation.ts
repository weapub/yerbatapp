import { RolUsuario } from '@prisma/client';
import { z } from 'zod';

export const createUserSchema = z.object({
  nombre: z.string().min(2).max(120),
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
    .regex(/[0-9]/, 'Debe incluir al menos un número'),
  rol: z.nativeEnum(RolUsuario).default(RolUsuario.EMPLEADO),
});

export const updateUserSchema = z.object({
  nombre: z.string().min(2).max(120).optional(),
  rol: z.nativeEnum(RolUsuario).optional(),
  activo: z.boolean().optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('id inválido'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
