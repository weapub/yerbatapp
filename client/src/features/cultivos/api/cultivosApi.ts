import { api } from '@/lib/axios';
import { Cultivo } from '@/types/campos';
import { PaginatedResponse } from '@/types/common';

export interface ListCultivosParams {
  page?: number;
  pageSize?: number;
  campoId?: string;
  estadoSanitario?: 'EXCELENTE' | 'BUENO' | 'REGULAR' | 'MALO';
}

export interface CultivoFormValues {
  campoId: string;
  nombre: string;
  variedad?: string;
  fechaPlantacion: string;
  cantidadPlantas: number;
  estadoSanitario: 'EXCELENTE' | 'BUENO' | 'REGULAR' | 'MALO';
  produccionEsperadaKg?: number;
}

export const cultivosApi = {
  list: (params: ListCultivosParams) =>
    api.get<PaginatedResponse<Cultivo>>('/cultivos', { params }).then((r) => r.data),

  getById: (id: string) => api.get<Cultivo>(`/cultivos/${id}`).then((r) => r.data),

  create: (values: CultivoFormValues) => api.post<Cultivo>('/cultivos', values).then((r) => r.data),

  update: (id: string, values: Partial<Omit<CultivoFormValues, 'campoId'>>) =>
    api.patch<Cultivo>(`/cultivos/${id}`, values).then((r) => r.data),

  delete: (id: string) => api.delete(`/cultivos/${id}`),

  addHistorial: (id: string, values: { evento: string; detalle?: string }) =>
    api.post(`/cultivos/${id}/historial`, values).then((r) => r.data),
};
