import { AppError } from '../../shared/errors/AppError';
import { buildPaginationMeta, PaginatedResult } from '../../shared/utils/pagination';
import { toTareaDto } from './tareas.dto';
import { tareasRepository } from './tareas.repository';
import { CalendarioQuery, CreateTareaInput, ListTareasQuery, UpdateTareaInput } from './tareas.validation';

const getTareaOrThrow = async (id: string, tenantId: string) => {
  const tarea = await tareasRepository.findByIdInTenant(id, tenantId);
  if (!tarea) throw AppError.notFound('Tarea no encontrada');
  return tarea;
};

export const tareasService = {
  async list(tenantId: string, query: ListTareasQuery): Promise<PaginatedResult<ReturnType<typeof toTareaDto>>> {
    const { data, total } = await tareasRepository.findManyPaginated(tenantId, query);
    return { data: data.map(toTareaDto), meta: buildPaginationMeta(total, query) };
  },

  async getById(id: string, tenantId: string) {
    return toTareaDto(await getTareaOrThrow(id, tenantId));
  },

  async create(tenantId: string, input: CreateTareaInput) {
    const campo = await tareasRepository.findCampoInTenant(input.campoId, tenantId);
    if (!campo) throw AppError.notFound('Campo no encontrado');

    if (input.cultivoId) {
      const cultivo = await tareasRepository.findCultivoInCampo(input.cultivoId, input.campoId);
      if (!cultivo) throw AppError.notFound('El cultivo no pertenece a ese campo');
    }

    const responsable = await tareasRepository.findUserInTenant(input.responsableId, tenantId);
    if (!responsable) throw AppError.notFound('Responsable no encontrado');

    const tarea = await tareasRepository.create({
      tipo: input.tipo,
      fechaProgramada: input.fechaProgramada,
      prioridad: input.prioridad,
      observaciones: input.observaciones,
      tenant: { connect: { id: tenantId } },
      campo: { connect: { id: input.campoId } },
      ...(input.cultivoId ? { cultivo: { connect: { id: input.cultivoId } } } : {}),
      responsable: { connect: { id: input.responsableId } },
    });
    return toTareaDto(tarea);
  },

  async update(id: string, tenantId: string, input: UpdateTareaInput) {
    await getTareaOrThrow(id, tenantId);

    const { cultivoId, responsableId, fechaRealizada, ...rest } = input;
    const tarea = await tareasRepository.update(id, {
      ...rest,
      ...(fechaRealizada !== undefined ? { fechaRealizada } : {}),
      ...(cultivoId !== undefined ? { cultivo: cultivoId ? { connect: { id: cultivoId } } : { disconnect: true } } : {}),
      ...(responsableId !== undefined ? { responsable: { connect: { id: responsableId } } } : {}),
    });
    return toTareaDto(tarea);
  },

  async delete(id: string, tenantId: string): Promise<void> {
    await getTareaOrThrow(id, tenantId);
    await tareasRepository.delete(id);
  },

  async addAdjunto(id: string, tenantId: string, file: { url: string; nombreArchivo: string }) {
    await getTareaOrThrow(id, tenantId);
    return tareasRepository.addAdjunto(id, file);
  },

  async calendario(tenantId: string, query: CalendarioQuery) {
    const tareas = await tareasRepository.findCalendario(tenantId, query.desde, query.hasta);
    return tareas.map(toTareaDto);
  },
};
