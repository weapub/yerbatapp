import { AplicacionInsumo } from '@prisma/client';

export const toAplicacionHistorialDto = (
  aplicacion: AplicacionInsumo & {
    campo: { nombre: string };
    cultivo: { nombre: string };
    producto: { nombre: string; marca: string | null; tipo: string };
  },
) => ({
  id: aplicacion.id,
  fecha: aplicacion.fecha,
  tipo: aplicacion.tipo,
  campo: aplicacion.campo.nombre,
  cultivo: aplicacion.cultivo.nombre,
  producto: aplicacion.producto.nombre,
  marca: aplicacion.producto.marca,
  cantidadUtilizada: Number(aplicacion.cantidadUtilizada),
  costo: Number(aplicacion.costo),
});
