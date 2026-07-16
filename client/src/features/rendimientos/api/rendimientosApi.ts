import { api } from '@/lib/axios';
import { ComparativaGroupBy, ComparativaRow, Rendimiento, UnidadProduccion } from '@/types/rendimientos';
import { PaginatedResponse } from '@/types/common';

export interface ListRendimientosParams {
  page?: number;
  pageSize?: number;
  campoId?: string;
  cultivoId?: string;
  campaniaId?: string;
}

export interface RendimientoFormValues {
  campoId: string;
  cultivoId: string;
  campaniaId: string;
  fecha: string;
  produccion: number;
  unidad: UnidadProduccion;
  costo: number;
  ingreso: number;
}

export interface ComparativaParams {
  groupBy: ComparativaGroupBy;
  campaniaId?: string;
  campoId?: string;
  cultivoId?: string;
}

export const rendimientosApi = {
  list: (params: ListRendimientosParams) =>
    api.get<PaginatedResponse<Rendimiento>>('/rendimientos', { params }).then((r) => r.data),

  create: (values: RendimientoFormValues) =>
    api.post<Rendimiento>('/rendimientos', values).then((r) => r.data),

  update: (id: string, values: Partial<Omit<RendimientoFormValues, 'campoId' | 'cultivoId' | 'campaniaId'>>) =>
    api.patch<Rendimiento>(`/rendimientos/${id}`, values).then((r) => r.data),

  delete: (id: string) => api.delete(`/rendimientos/${id}`),

  comparativa: (params: ComparativaParams) =>
    api.get<ComparativaRow[]>('/rendimientos/comparativa', { params }).then((r) => r.data),
};
