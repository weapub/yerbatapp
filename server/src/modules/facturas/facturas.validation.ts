import { EstadoFactura, TipoFactura, TipoOperacionFactura } from '@prisma/client';
import { z } from 'zod';
import { paginationSchema } from '../../shared/utils/pagination';

export const createFacturaSchema = z
  .object({
    tipo: z.nativeEnum(TipoFactura),
    operacion: z.nativeEnum(TipoOperacionFactura),
    numero: z.string().min(1).max(50),
    clienteId: z.string().uuid().optional(),
    proveedorId: z.string().uuid().optional(),
    fecha: z.coerce.date(),
    cae: z.string().max(50).optional(),
    importeNeto: z.coerce.number().nonnegative(),
    iva: z.coerce.number().nonnegative(),
  })
  .refine((data) => (data.operacion === 'VENTA' ? Boolean(data.clienteId) && !data.proveedorId : true), {
    message: 'Una factura de VENTA requiere clienteId y no debe tener proveedorId',
    path: ['clienteId'],
  })
  .refine((data) => (data.operacion === 'COMPRA' ? Boolean(data.proveedorId) && !data.clienteId : true), {
    message: 'Una factura de COMPRA requiere proveedorId y no debe tener clienteId',
    path: ['proveedorId'],
  });

export const updateFacturaSchema = z.object({
  cae: z.string().max(50).optional(),
  estado: z.nativeEnum(EstadoFactura).optional(),
});

export const facturaIdParamSchema = z.object({ id: z.string().uuid('id inválido') });

export const listFacturasQuerySchema = paginationSchema.extend({
  operacion: z.nativeEnum(TipoOperacionFactura).optional(),
  estado: z.nativeEnum(EstadoFactura).optional(),
  tipo: z.nativeEnum(TipoFactura).optional(),
  clienteId: z.string().uuid().optional(),
  proveedorId: z.string().uuid().optional(),
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
});

export const panelIvaQuerySchema = z.object({
  desde: z.coerce.date(),
  hasta: z.coerce.date(),
});

export const exportarIvaQuerySchema = panelIvaQuerySchema.extend({
  formato: z.enum(['excel', 'pdf']),
});

export type CreateFacturaInput = z.infer<typeof createFacturaSchema>;
export type UpdateFacturaInput = z.infer<typeof updateFacturaSchema>;
export type ListFacturasQuery = z.infer<typeof listFacturasQuerySchema>;
export type PanelIvaQuery = z.infer<typeof panelIvaQuerySchema>;
export type ExportarIvaQuery = z.infer<typeof exportarIvaQuerySchema>;
