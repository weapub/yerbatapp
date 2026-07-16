import { AppError } from '../../shared/errors/AppError';
import { buildPaginationMeta, PaginatedResult } from '../../shared/utils/pagination';
import { toCultivoDto } from './cultivos.dto';
import { cultivosRepository } from './cultivos.repository';
import { CreateCultivoInput, CreateHistorialInput, ListCultivosQuery, UpdateCultivoInput } from './cultivos.validation';

const getCultivoOrThrow = async (id: string, tenantId: string) => {
  const cultivo = await cultivosRepository.findByIdInTenant(id, tenantId);
  if (!cultivo) throw AppError.notFound('Cultivo no encontrado');
  return cultivo;
};

export const cultivosService = {
  async list(tenantId: string, query: ListCultivosQuery): Promise<PaginatedResult<ReturnType<typeof toCultivoDto>>> {
    const { data, total } = await cultivosRepository.findManyPaginated(tenantId, query);
    return { data: data.map(toCultivoDto), meta: buildPaginationMeta(total, query) };
  },

  async getById(id: string, tenantId: string) {
    const cultivo = await getCultivoOrThrow(id, tenantId);
    return toCultivoDto(cultivo);
  },

  async create(tenantId: string, input: CreateCultivoInput) {
    const campo = await cultivosRepository.findCampoInTenant(input.campoId, tenantId);
    if (!campo) throw AppError.notFound('Campo no encontrado');

    const cultivo = await cultivosRepository.create({
      nombre: input.nombre,
      variedad: input.variedad,
      fechaPlantacion: input.fechaPlantacion,
      cantidadPlantas: input.cantidadPlantas,
      estadoSanitario: input.estadoSanitario,
      produccionEsperadaKg: input.produccionEsperadaKg,
      campo: { connect: { id: input.campoId } },
    });
    return toCultivoDto(cultivo);
  },

  async update(id: string, tenantId: string, input: UpdateCultivoInput) {
    await getCultivoOrThrow(id, tenantId);
    const cultivo = await cultivosRepository.update(id, input);
    return toCultivoDto(cultivo);
  },

  async delete(id: string, tenantId: string): Promise<void> {
    await getCultivoOrThrow(id, tenantId);
    await cultivosRepository.delete(id);
  },

  async addHistorial(id: string, tenantId: string, input: CreateHistorialInput) {
    await getCultivoOrThrow(id, tenantId);
    return cultivosRepository.createHistorial(id, input);
  },
};
