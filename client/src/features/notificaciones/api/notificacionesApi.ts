import { api } from '@/lib/axios';
import { Notificacion } from '@/types/notificaciones';
import { PaginatedResponse } from '@/types/common';

export const notificacionesApi = {
  list: (leida?: boolean) =>
    api.get<PaginatedResponse<Notificacion>>('/notificaciones', { params: { leida, pageSize: 20 } }).then((r) => r.data),

  countNoLeidas: () => api.get<{ noLeidas: number }>('/notificaciones/no-leidas').then((r) => r.data.noLeidas),

  marcarLeida: (id: string) => api.patch<Notificacion>(`/notificaciones/${id}/leida`).then((r) => r.data),

  marcarTodasLeidas: () => api.patch('/notificaciones/marcar-todas-leidas'),

  generarAlertas: () => api.post<{ notificacionesCreadas: number }>('/notificaciones/generar-alertas').then((r) => r.data),
};
