import { api } from '@/lib/axios';
import {
  Balance,
  CategoriaFinanciera,
  CentroCosto,
  CuentaFinanciera,
  FlujoCajaPunto,
  MovimientoFinanciero,
  TipoCuentaFinanciera,
  TipoMovimientoFinanciero,
} from '@/types/finanzas';
import { PaginatedResponse } from '@/types/common';

export interface ListMovimientosParams {
  page?: number;
  pageSize?: number;
  cuentaId?: string;
  categoriaId?: string;
  centroCostoId?: string;
  tipo?: TipoMovimientoFinanciero;
  desde?: string;
  hasta?: string;
}

export interface MovimientoFormValues {
  cuentaId: string;
  categoriaId: string;
  centroCostoId?: string;
  tipo: TipoMovimientoFinanciero;
  monto: number;
  fecha: string;
  descripcion?: string;
}

export const finanzasApi = {
  // Cuentas
  listCuentas: () => api.get<CuentaFinanciera[]>('/finanzas/cuentas').then((r) => r.data),
  createCuenta: (values: { nombre: string; tipo: TipoCuentaFinanciera; saldoInicial: number }) =>
    api.post<CuentaFinanciera>('/finanzas/cuentas', values).then((r) => r.data),
  deleteCuenta: (id: string) => api.delete(`/finanzas/cuentas/${id}`),

  // Categorías
  listCategorias: () => api.get<CategoriaFinanciera[]>('/finanzas/categorias').then((r) => r.data),
  createCategoria: (values: { nombre: string; tipo: TipoMovimientoFinanciero }) =>
    api.post<CategoriaFinanciera>('/finanzas/categorias', values).then((r) => r.data),
  deleteCategoria: (id: string) => api.delete(`/finanzas/categorias/${id}`),

  // Centros de costo
  listCentrosCosto: () => api.get<CentroCosto[]>('/finanzas/centros-costo').then((r) => r.data),
  createCentroCosto: (values: { nombre: string }) =>
    api.post<CentroCosto>('/finanzas/centros-costo', values).then((r) => r.data),
  deleteCentroCosto: (id: string) => api.delete(`/finanzas/centros-costo/${id}`),

  // Movimientos
  listMovimientos: (params: ListMovimientosParams) =>
    api.get<PaginatedResponse<MovimientoFinanciero>>('/finanzas/movimientos', { params }).then((r) => r.data),
  createMovimiento: (values: MovimientoFormValues) =>
    api.post<MovimientoFinanciero>('/finanzas/movimientos', values).then((r) => r.data),
  deleteMovimiento: (id: string) => api.delete(`/finanzas/movimientos/${id}`),
  addAdjunto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post(`/finanzas/movimientos/${id}/adjuntos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  // Reportes
  balance: (desde: string, hasta: string, cuentaId?: string) =>
    api.get<Balance>('/finanzas/balance', { params: { desde, hasta, cuentaId } }).then((r) => r.data),
  flujoCaja: (desde: string, hasta: string, groupBy: 'dia' | 'mes' = 'mes', cuentaId?: string) =>
    api
      .get<FlujoCajaPunto[]>('/finanzas/flujo-caja', { params: { desde, hasta, groupBy, cuentaId } })
      .then((r) => r.data),
};
