import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../prisma/client', () => ({ prisma: {} }));

vi.mock('./notificaciones.repository', () => ({
  notificacionesRepository: {
    findManyPaginated: vi.fn(),
    countNoLeidas: vi.fn(),
    findByIdForUser: vi.fn(),
    marcarLeida: vi.fn(),
    marcarTodasLeidas: vi.fn(),
  },
}));

import { notificacionesRepository } from './notificaciones.repository';
import { notificacionesService } from './notificaciones.service';

const userId = 'user-1';

describe('notificacionesService.marcarLeida', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lanza 404 si la notificación no le pertenece al usuario', async () => {
    vi.mocked(notificacionesRepository.findByIdForUser).mockResolvedValue(null);

    await expect(notificacionesService.marcarLeida('notif-ajena', userId)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(notificacionesRepository.marcarLeida).not.toHaveBeenCalled();
  });

  it('marca la notificación como leída si le pertenece al usuario', async () => {
    vi.mocked(notificacionesRepository.findByIdForUser).mockResolvedValue({ id: 'notif-1' } as never);
    vi.mocked(notificacionesRepository.marcarLeida).mockResolvedValue({ id: 'notif-1', leida: true } as never);

    await notificacionesService.marcarLeida('notif-1', userId);

    expect(notificacionesRepository.marcarLeida).toHaveBeenCalledWith('notif-1');
  });
});
