import { AppError } from '../../shared/errors/AppError';
import { buildPaginationMeta, PaginatedResult } from '../../shared/utils/pagination';
import { toAplicacionDto } from './insumos.dto';
import { insumosRepository } from './insumos.repository';
import {
  CreateAplicacionInput,
  EstadisticasQuery,
  ListAplicacionesQuery,
  UpdateAplicacionInput,
} from './insumos.validation';

const getAplicacionOrThrow = async (id: string, tenantId: string) => {
  const aplicacion = await insumosRepository.findByIdInTenant(id, tenantId);
  if (!aplicacion) throw AppError.notFound('Aplicación no encontrada');
  return aplicacion;
};

export const insumosService = {
  async list(
    tenantId: string,
    query: ListAplicacionesQuery,
  ): Promise<PaginatedResult<ReturnType<typeof toAplicacionDto>>> {
    const { data, total } = await insumosRepository.findManyPaginated(tenantId, query);
    return { data: data.map(toAplicacionDto), meta: buildPaginationMeta(total, query) };
  },

  async getById(id: string, tenantId: string) {
    return toAplicacionDto(await getAplicacionOrThrow(id, tenantId));
  },

  async create(tenantId: string, input: CreateAplicacionInput) {
    const campo = await insumosRepository.findCampoInTenant(input.campoId, tenantId);
    if (!campo) throw AppError.notFound('Campo no encontrado');

    const cultivo = await insumosRepository.findCultivoInCampo(input.cultivoId, input.campoId);
    if (!cultivo) throw AppError.notFound('El cultivo no pertenece a ese campo');

    const proveedor = await insumosRepository.findProveedorInTenant(input.proveedorId, tenantId);
    if (!proveedor) throw AppError.notFound('Proveedor no encontrado');

    const producto = await insumosRepository.findProductoInTenant(input.productoId, input.proveedorId, tenantId);
    if (!producto) throw AppError.notFound('El producto no pertenece a ese proveedor');

    const aplicador = await insumosRepository.findUserInTenant(input.aplicadorId, tenantId);
    if (!aplicador) throw AppError.notFound('Aplicador no encontrado');

    const aplicacion = await insumosRepository.create({
      tipo: producto.tipo,
      fecha: input.fecha,
      dosisHa: input.dosisHa,
      cantidadUtilizada: input.cantidadUtilizada,
      costo: input.costo,
      observaciones: input.observaciones,
      campo: { connect: { id: input.campoId } },
      cultivo: { connect: { id: input.cultivoId } },
      producto: { connect: { id: input.productoId } },
      proveedor: { connect: { id: input.proveedorId } },
      aplicador: { connect: { id: input.aplicadorId } },
    });
    return toAplicacionDto(aplicacion);
  },

  async update(id: string, tenantId: string, input: UpdateAplicacionInput) {
    await getAplicacionOrThrow(id, tenantId);
    const aplicacion = await insumosRepository.update(id, input);
    return toAplicacionDto(aplicacion);
  },

  async delete(id: string, tenantId: string): Promise<void> {
    await getAplicacionOrThrow(id, tenantId);
    await insumosRepository.delete(id);
  },

  async estadisticas(tenantId: string, query: EstadisticasQuery) {
    const registros = await insumosRepository.findManyForStats(tenantId, query.tipo, query.campoId, query.cultivoId);

    if (registros.length === 0) {
      return {
        promedioDosisHa: 0,
        costoTotal: 0,
        costoPromedioHa: 0,
        porCultivo: [],
        porAnio: [],
      };
    }

    const dosis = registros.map((r) => Number(r.dosisHa));
    const costos = registros.map((r) => Number(r.costo));
    const costoTotal = costos.reduce((acc, c) => acc + c, 0);

    const costosPorHa = registros
      .map((r) => {
        const superficie = Number(r.campo.superficieHa);
        return superficie > 0 ? Number(r.costo) / superficie : null;
      })
      .filter((v): v is number => v !== null);

    const porCultivoMap = new Map<string, { nombre: string; dosis: number[]; costo: number }>();
    const porAnioMap = new Map<number, { dosis: number[]; costo: number }>();

    for (const r of registros) {
      const cultivoEntry = porCultivoMap.get(r.cultivoId) ?? { nombre: r.cultivo.nombre, dosis: [], costo: 0 };
      cultivoEntry.dosis.push(Number(r.dosisHa));
      cultivoEntry.costo += Number(r.costo);
      porCultivoMap.set(r.cultivoId, cultivoEntry);

      const anio = r.fecha.getFullYear();
      const anioEntry = porAnioMap.get(anio) ?? { dosis: [], costo: 0 };
      anioEntry.dosis.push(Number(r.dosisHa));
      anioEntry.costo += Number(r.costo);
      porAnioMap.set(anio, anioEntry);
    }

    const average = (values: number[]) => values.reduce((acc, v) => acc + v, 0) / values.length;

    return {
      promedioDosisHa: Number(average(dosis).toFixed(2)),
      costoTotal: Number(costoTotal.toFixed(2)),
      costoPromedioHa: costosPorHa.length > 0 ? Number(average(costosPorHa).toFixed(2)) : 0,
      porCultivo: Array.from(porCultivoMap.entries()).map(([cultivoId, v]) => ({
        cultivoId,
        nombre: v.nombre,
        promedioDosisHa: Number(average(v.dosis).toFixed(2)),
        costoTotal: Number(v.costo.toFixed(2)),
      })),
      porAnio: Array.from(porAnioMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([anio, v]) => ({
          anio,
          promedioDosisHa: Number(average(v.dosis).toFixed(2)),
          costoTotal: Number(v.costo.toFixed(2)),
        })),
    };
  },
};
