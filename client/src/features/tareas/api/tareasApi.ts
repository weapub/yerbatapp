import { api } from '@/lib/axios';
import { EstadoTarea, PrioridadTarea, Semaforo, Tarea, TipoTarea } from '@/types/tareas';
import { PaginatedResponse } from '@/types/common';

export interface ListTareasParams {
  page?: number;
  pageSize?: number;
  campoId?: string;
  cultivoId?: string;
  responsableId?: string;
  estado?: EstadoTarea;
  prioridad?: PrioridadTarea;
  tipo?: TipoTarea;
  semaforo?: Semaforo;
}

export interface TareaFormValues {
  tipo: TipoTarea;
  campoId: string;
  cultivoId?: string;
  responsableId: string;
  fechaProgramada: string;
  prioridad: PrioridadTarea;
  observaciones?: string;
}

export interface UpdateTareaValues {
  estado?: EstadoTarea;
  fechaRealizada?: string | null;
  prioridad?: PrioridadTarea;
  observaciones?: string;
}

export const tareasApi = {
  list: (params: ListTareasParams) =>
    api.get<PaginatedResponse<Tarea>>('/tareas', { params }).then((r) => r.data),

  calendario: (desde: string, hasta: string) =>
    api.get<Tarea[]>('/tareas/calendario', { params: { desde, hasta } }).then((r) => r.data),

  create: (values: TareaFormValues) => api.post<Tarea>('/tareas', values).then((r) => r.data),

  update: (id: string, values: UpdateTareaValues) => api.patch<Tarea>(`/tareas/${id}`, values).then((r) => r.data),

  delete: (id: string) => api.delete(`/tareas/${id}`),

  addAdjunto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post(`/tareas/${id}/adjuntos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
};
