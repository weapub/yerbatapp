import { api } from '@/lib/axios';
import { Cliente, MovimientoCCCliente, TipoMovimientoCCCliente } from '@/types/clientes';
import { PaginatedResponse } from '@/types/common';

export interface ListClientesParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ClienteFormValues {
  razonSocial: string;
  cuit: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}

export interface MovimientoCCClienteFormValues {
  tipo: TipoMovimientoCCCliente;
  monto: number;
  fecha: string;
  descripcion?: string;
}

export const clientesApi = {
  list: (params: ListClientesParams) =>
    api.get<PaginatedResponse<Cliente>>('/clientes', { params }).then((r) => r.data),

  getById: (id: string) => api.get<Cliente>(`/clientes/${id}`).then((r) => r.data),

  create: (values: ClienteFormValues) => api.post<Cliente>('/clientes', values).then((r) => r.data),

  update: (id: string, values: Partial<ClienteFormValues>) =>
    api.patch<Cliente>(`/clientes/${id}`, values).then((r) => r.data),

  delete: (id: string) => api.delete(`/clientes/${id}`),

  listMovimientosCC: (id: string) => api.get<MovimientoCCCliente[]>(`/clientes/${id}/cuenta-corriente`).then((r) => r.data),

  registrarMovimientoCC: (id: string, values: MovimientoCCClienteFormValues) =>
    api.post<MovimientoCCCliente>(`/clientes/${id}/cuenta-corriente`, values).then((r) => r.data),
};
