import { MovimientoFinanciero } from '@prisma/client';

export const toMovimientoDto = (movimiento: MovimientoFinanciero & Record<string, unknown>) => ({
  ...movimiento,
  monto: Number(movimiento.monto),
});
