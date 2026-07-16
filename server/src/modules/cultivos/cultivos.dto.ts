import { Cultivo } from '@prisma/client';

export const toCultivoDto = (cultivo: Cultivo) => ({
  ...cultivo,
  produccionEsperadaKg: cultivo.produccionEsperadaKg ? Number(cultivo.produccionEsperadaKg) : null,
});
