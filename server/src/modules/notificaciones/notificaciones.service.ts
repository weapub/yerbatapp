import { AppError } from '../../shared/errors/AppError';
import { buildPaginationMeta, PaginatedResult } from '../../shared/utils/pagination';
import { notificacionesRepository } from './notificaciones.repository';
import { ListNotificacionesQuery } from './notificaciones.validation';

export const notificacionesService = {
  async list(userId: string, query: ListNotificacionesQuery): Promise<PaginatedResult<unknown>> {
    const { data, total } = await notificacionesRepository.findManyPaginated(userId, query);
    return { data, meta: buildPaginationMeta(total, query) };
  },

  countNoLeidas: (userId: string) => notificacionesRepository.countNoLeidas(userId),

  async marcarLeida(id: string, userId: string) {
    const notif = await notificacionesRepository.findByIdForUser(id, userId);
    if (!notif) throw AppError.notFound('Notificación no encontrada');
    return notificacionesRepository.marcarLeida(id);
  },

  async marcarTodasLeidas(userId: string) {
    await notificacionesRepository.marcarTodasLeidas(userId);
  },
};
