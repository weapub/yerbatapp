import { z } from 'zod';

export const TIPOS_REPORTE = [
  'produccion',
  'costos',
  'rentabilidad',
  'cultivos',
  'campos',
  'quimicos',
  'proveedores',
  'clientes',
  'facturacion',
  'iva',
  'caja',
  'tareas',
] as const;

export const tipoReporteSchema = z.enum(TIPOS_REPORTE);

export const reporteParamsSchema = z.object({
  tipo: tipoReporteSchema,
});

export const reporteQuerySchema = z.object({
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
});

export const exportarReporteQuerySchema = reporteQuerySchema.extend({
  formato: z.enum(['csv', 'excel', 'pdf']),
});

export type TipoReporte = z.infer<typeof tipoReporteSchema>;
export type ReporteQuery = z.infer<typeof reporteQuerySchema>;
export type ExportarReporteQuery = z.infer<typeof exportarReporteQuerySchema>;
