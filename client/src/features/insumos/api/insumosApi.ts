import { api } from '@/lib/axios';
import { AplicacionInsumo, EstadisticasInsumo, TipoInsumo } from '@/types/insumos';
import { PaginatedResponse } from '@/types/common';

export interface ListAplicacionesParams {
  page?: number;
  pageSize?: number;
  tipo?: TipoInsumo;
  campoId?: string;
  cultivoId?: string;
  proveedorId?: string;
}

export interface AplicacionFormValues {
  campoId: string;
  cultivoId: string;
  productoId: string;
  proveedorId: string;
  fecha: string;
  dosisHa: number;
  cantidadUtilizada: number;
  costo: number;
  aplicadorId: string;
  observaciones?: string;
}

export interface EstadisticasParams {
  tipo: TipoInsumo;
  campoId?: string;
  cultivoId?: string;
}

export const insumosApi = {
  list: (params: ListAplicacionesParams) =>
    api.get<PaginatedResponse<AplicacionInsumo>>('/insumos', { params }).then((r) => r.data),

  create: (values: AplicacionFormValues) => api.post<AplicacionInsumo>('/insumos', values).then((r) => r.data),

  delete: (id: string) => api.delete(`/insumos/${id}`),

  estadisticas: (params: EstadisticasParams) =>
    api.get<EstadisticasInsumo>('/insumos/estadisticas', { params }).then((r) => r.data),
};
