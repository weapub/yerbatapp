import { api } from '@/lib/axios';
import { HistorialAplicacion, MovimientoCCProveedor, Producto, Proveedor, TipoInsumo, TipoMovimientoCCProveedor } from '@/types/insumos';
import { PaginatedResponse } from '@/types/common';

export interface ListProveedoresParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ProveedorFormValues {
  empresa: string;
  cuit: string;
  contacto?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

export interface ProductoFormValues {
  nombre: string;
  marca?: string;
  tipo: TipoInsumo;
}

export interface MovimientoCCProveedorFormValues {
  tipo: TipoMovimientoCCProveedor;
  monto: number;
  fecha: string;
  descripcion?: string;
}

export const proveedoresApi = {
  list: (params: ListProveedoresParams) =>
    api.get<PaginatedResponse<Proveedor>>('/proveedores', { params }).then((r) => r.data),

  getById: (id: string) => api.get<Proveedor>(`/proveedores/${id}`).then((r) => r.data),

  create: (values: ProveedorFormValues) => api.post<Proveedor>('/proveedores', values).then((r) => r.data),

  update: (id: string, values: Partial<ProveedorFormValues>) =>
    api.patch<Proveedor>(`/proveedores/${id}`, values).then((r) => r.data),

  delete: (id: string) => api.delete(`/proveedores/${id}`),

  createProducto: (proveedorId: string, values: ProductoFormValues) =>
    api.post<Producto>(`/proveedores/${proveedorId}/productos`, values).then((r) => r.data),

  historial: (proveedorId: string) =>
    api.get<HistorialAplicacion[]>(`/proveedores/${proveedorId}/historial`).then((r) => r.data),

  listMovimientosCC: (proveedorId: string) =>
    api.get<MovimientoCCProveedor[]>(`/proveedores/${proveedorId}/cuenta-corriente`).then((r) => r.data),

  registrarMovimientoCC: (proveedorId: string, values: MovimientoCCProveedorFormValues) =>
    api.post<MovimientoCCProveedor>(`/proveedores/${proveedorId}/cuenta-corriente`, values).then((r) => r.data),
};
