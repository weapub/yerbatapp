import { api } from '@/lib/axios';
import { EstadoFactura, Factura, PanelIva, TipoFactura, TipoOperacionFactura } from '@/types/facturas';
import { PaginatedResponse } from '@/types/common';

export interface ListFacturasParams {
  page?: number;
  pageSize?: number;
  operacion?: TipoOperacionFactura;
  estado?: EstadoFactura;
  tipo?: TipoFactura;
  clienteId?: string;
  proveedorId?: string;
  desde?: string;
  hasta?: string;
}

export interface FacturaFormValues {
  tipo: TipoFactura;
  operacion: TipoOperacionFactura;
  numero: string;
  clienteId?: string;
  proveedorId?: string;
  fecha: string;
  cae?: string;
  importeNeto: number;
  iva: number;
}

export const facturasApi = {
  list: (params: ListFacturasParams) =>
    api.get<PaginatedResponse<Factura>>('/facturas', { params }).then((r) => r.data),

  getById: (id: string) => api.get<Factura>(`/facturas/${id}`).then((r) => r.data),

  create: (values: FacturaFormValues) => api.post<Factura>('/facturas', values).then((r) => r.data),

  update: (id: string, values: Partial<{ cae: string; estado: EstadoFactura }>) =>
    api.patch<Factura>(`/facturas/${id}`, values).then((r) => r.data),

  delete: (id: string) => api.delete(`/facturas/${id}`),

  addAdjunto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post(`/facturas/${id}/adjuntos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },

  panelIva: (desde: string, hasta: string) =>
    api.get<PanelIva>('/facturas/iva', { params: { desde, hasta } }).then((r) => r.data),

  exportarIva: async (desde: string, hasta: string, formato: 'excel' | 'pdf') => {
    const response = await api.get('/facturas/iva/exportar', {
      params: { desde, hasta, formato },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `panel-iva_${desde}_${hasta}.${formato === 'excel' ? 'xlsx' : 'pdf'}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
