import { Factura } from '@prisma/client';

export const toFacturaDto = (factura: Factura & Record<string, unknown>) => ({
  ...factura,
  importeNeto: Number(factura.importeNeto),
  iva: Number(factura.iva),
  total: Number(factura.total),
});
