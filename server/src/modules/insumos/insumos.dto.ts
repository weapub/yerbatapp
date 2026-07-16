import { AplicacionInsumo } from '@prisma/client';

type AplicacionConRelaciones = AplicacionInsumo & {
  campo: { nombre: string; superficieHa: unknown };
  cultivo: { nombre: string };
  producto: { nombre: string; marca: string | null };
  proveedor: { empresa: string };
  aplicador: { nombre: string };
};

export const toAplicacionDto = (aplicacion: AplicacionConRelaciones) => {
  const costo = Number(aplicacion.costo);
  const superficieHa = Number(aplicacion.campo.superficieHa);

  return {
    ...aplicacion,
    dosisHa: Number(aplicacion.dosisHa),
    cantidadUtilizada: Number(aplicacion.cantidadUtilizada),
    costo,
    costoPorHa: superficieHa > 0 ? Number((costo / superficieHa).toFixed(2)) : null,
  };
};
