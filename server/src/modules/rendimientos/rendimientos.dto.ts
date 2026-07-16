import { Rendimiento } from '@prisma/client';

export const toRendimientoDto = (rendimiento: Rendimiento & { campo?: { nombre: string }; cultivo?: { nombre: string }; campania?: { nombre: string } }) => {
  const produccion = Number(rendimiento.produccion);
  const rendimientoHa = Number(rendimiento.rendimientoHa);
  const costo = Number(rendimiento.costo);
  const ingreso = Number(rendimiento.ingreso);
  const rentabilidad = ingreso - costo;

  return {
    ...rendimiento,
    produccion,
    rendimientoHa,
    costo,
    ingreso,
    rentabilidad,
    rentabilidadPorcentaje: costo > 0 ? Number(((rentabilidad / costo) * 100).toFixed(2)) : null,
  };
};
