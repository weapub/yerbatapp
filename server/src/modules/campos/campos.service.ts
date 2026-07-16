import { AppError } from '../../shared/errors/AppError';
import { buildPaginationMeta, PaginatedResult } from '../../shared/utils/pagination';
import { camposRepository } from './campos.repository';
import { toCampoDto } from './campos.dto';
import { CreateCampoInput, CreateNotaInput, ListCamposQuery, UpdateCampoInput } from './campos.validation';

const getCampoOrThrow = async (id: string, tenantId: string) => {
  const campo = await camposRepository.findByIdInTenant(id, tenantId);
  if (!campo) throw AppError.notFound('Campo no encontrado');
  return campo;
};

export const camposService = {
  async list(tenantId: string, query: ListCamposQuery): Promise<PaginatedResult<ReturnType<typeof toCampoDto>>> {
    const { data, total } = await camposRepository.findManyPaginated(tenantId, query);
    return { data: data.map(toCampoDto), meta: buildPaginationMeta(total, query) };
  },

  async getById(id: string, tenantId: string) {
    const campo = await getCampoOrThrow(id, tenantId);
    return toCampoDto(campo);
  },

  async create(tenantId: string, input: CreateCampoInput) {
    const campo = await camposRepository.create({
      nombre: input.nombre,
      ubicacion: input.ubicacion,
      superficieHa: input.superficieHa,
      latitud: input.latitud,
      longitud: input.longitud,
      estado: input.estado,
      observaciones: input.observaciones,
      tenant: { connect: { id: tenantId } },
      ...(input.responsableId ? { responsable: { connect: { id: input.responsableId } } } : {}),
    });
    return toCampoDto(campo);
  },

  async update(id: string, tenantId: string, input: UpdateCampoInput) {
    await getCampoOrThrow(id, tenantId);
    const { responsableId, ...rest } = input;
    const campo = await camposRepository.update(id, {
      ...rest,
      ...(responsableId !== undefined
        ? responsableId
          ? { responsable: { connect: { id: responsableId } } }
          : { responsable: { disconnect: true } }
        : {}),
    });
    return toCampoDto(campo);
  },

  async delete(id: string, tenantId: string): Promise<void> {
    await getCampoOrThrow(id, tenantId);
    await camposRepository.delete(id);
  },

  // ── Notas ──
  async listNotas(campoId: string, tenantId: string) {
    await getCampoOrThrow(campoId, tenantId);
    return camposRepository.findNotasByCampo(campoId);
  },

  async createNota(campoId: string, tenantId: string, usuarioId: string, input: CreateNotaInput) {
    await getCampoOrThrow(campoId, tenantId);
    return camposRepository.createNota({
      titulo: input.titulo,
      descripcion: input.descripcion,
      campo: { connect: { id: campoId } },
      usuario: { connect: { id: usuarioId } },
    });
  },

  async addNotaAdjunto(
    campoId: string,
    notaId: string,
    tenantId: string,
    file: { url: string; nombreArchivo: string; mimeType: string },
  ) {
    await getCampoOrThrow(campoId, tenantId);
    const nota = await camposRepository.findNotaInCampo(notaId, campoId);
    if (!nota) throw AppError.notFound('Nota no encontrada');
    return camposRepository.addNotaAdjunto(notaId, file);
  },

  // ── Documentos ──
  async listDocumentos(campoId: string, tenantId: string) {
    await getCampoOrThrow(campoId, tenantId);
    return camposRepository.findDocumentosByCampo(campoId);
  },

  async createDocumento(campoId: string, tenantId: string, data: { url: string; nombre: string; mimeType: string }) {
    await getCampoOrThrow(campoId, tenantId);
    return camposRepository.createDocumento({ ...data, campo: { connect: { id: campoId } } });
  },

  // ── Fotos ──
  async listFotos(campoId: string, tenantId: string) {
    await getCampoOrThrow(campoId, tenantId);
    return camposRepository.findFotosByCampo(campoId);
  },

  async createFoto(campoId: string, tenantId: string, data: { url: string; descripcion?: string }) {
    await getCampoOrThrow(campoId, tenantId);
    return camposRepository.createFoto({ ...data, campo: { connect: { id: campoId } } });
  },
};
