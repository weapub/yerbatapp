import { AppError } from '../../shared/errors/AppError';
import { campaniasRepository } from './campanias.repository';
import { CreateCampaniaInput, UpdateCampaniaInput } from './campanias.validation';

const getCampaniaOrThrow = async (id: string, tenantId: string) => {
  const campania = await campaniasRepository.findByIdInTenant(id, tenantId);
  if (!campania) throw AppError.notFound('Campaña no encontrada');
  return campania;
};

export const campaniasService = {
  list: (tenantId: string) => campaniasRepository.findManyByTenant(tenantId),

  async create(tenantId: string, input: CreateCampaniaInput) {
    return campaniasRepository.create({
      nombre: input.nombre,
      fechaInicio: input.fechaInicio,
      fechaFin: input.fechaFin,
      tenant: { connect: { id: tenantId } },
    });
  },

  async update(id: string, tenantId: string, input: UpdateCampaniaInput) {
    await getCampaniaOrThrow(id, tenantId);
    return campaniasRepository.update(id, input);
  },

  async delete(id: string, tenantId: string): Promise<void> {
    await getCampaniaOrThrow(id, tenantId);
    await campaniasRepository.delete(id);
  },
};
