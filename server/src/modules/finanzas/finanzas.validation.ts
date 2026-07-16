import { TipoCuentaFinanciera, TipoMovimientoFinanciero } from '@prisma/client';
import { z } from 'zod';
import { paginationSchema } from '../../shared/utils/pagination';

// ── Cuentas ──
export const createCuentaSchema = z.object({
  nombre: z.string().min(2).max(150),
  tipo: z.nativeEnum(TipoCuentaFinanciera),
  saldoInicial: z.coerce.number().default(0),
});
export const updateCuentaSchema = createCuentaSchema.partial();
export const cuentaIdParamSchema = z.object({ id: z.string().uuid('id inválido') });

// ── Categorías ──
export const createCategoriaSchema = z.object({
  nombre: z.string().min(2).max(100),
  tipo: z.nativeEnum(TipoMovimientoFinanciero),
});
export const updateCategoriaSchema = createCategoriaSchema.partial();
export const categoriaIdParamSchema = z.object({ id: z.string().uuid('id inválido') });

// ── Centros de costo ──
export const createCentroCostoSchema = z.object({ nombre: z.string().min(2).max(100) });
export const updateCentroCostoSchema = createCentroCostoSchema.partial();
export const centroCostoIdParamSchema = z.object({ id: z.string().uuid('id inválido') });

// ── Movimientos ──
export const createMovimientoSchema = z.object({
  cuentaId: z.string().uuid('cuentaId inválido'),
  categoriaId: z.string().uuid('categoriaId inválido'),
  centroCostoId: z.string().uuid().optional(),
  tipo: z.nativeEnum(TipoMovimientoFinanciero),
  monto: z.coerce.number().positive('Debe ser mayor a 0'),
  fecha: z.coerce.date(),
  descripcion: z.string().max(500).optional(),
});
export const updateMovimientoSchema = createMovimientoSchema.partial();
export const movimientoIdParamSchema = z.object({ id: z.string().uuid('id inválido') });

export const listMovimientosQuerySchema = paginationSchema.extend({
  cuentaId: z.string().uuid().optional(),
  categoriaId: z.string().uuid().optional(),
  centroCostoId: z.string().uuid().optional(),
  tipo: z.nativeEnum(TipoMovimientoFinanciero).optional(),
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
});

// ── Reportes ──
export const rangoFechasQuerySchema = z.object({
  desde: z.coerce.date(),
  hasta: z.coerce.date(),
  cuentaId: z.string().uuid().optional(),
});

export const flujoCajaQuerySchema = rangoFechasQuerySchema.extend({
  groupBy: z.enum(['dia', 'mes']).default('mes'),
});

export type CreateCuentaInput = z.infer<typeof createCuentaSchema>;
export type UpdateCuentaInput = z.infer<typeof updateCuentaSchema>;
export type CreateCategoriaInput = z.infer<typeof createCategoriaSchema>;
export type UpdateCategoriaInput = z.infer<typeof updateCategoriaSchema>;
export type CreateCentroCostoInput = z.infer<typeof createCentroCostoSchema>;
export type UpdateCentroCostoInput = z.infer<typeof updateCentroCostoSchema>;
export type CreateMovimientoInput = z.infer<typeof createMovimientoSchema>;
export type UpdateMovimientoInput = z.infer<typeof updateMovimientoSchema>;
export type ListMovimientosQuery = z.infer<typeof listMovimientosQuerySchema>;
export type RangoFechasQuery = z.infer<typeof rangoFechasQuerySchema>;
export type FlujoCajaQuery = z.infer<typeof flujoCajaQuerySchema>;
