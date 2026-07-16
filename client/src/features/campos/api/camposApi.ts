import { api } from '@/lib/axios';
import { Campo, CampoDocumento, CampoFoto, CampoNota } from '@/types/campos';
import { PaginatedResponse } from '@/types/common';

export interface ListCamposParams {
  page?: number;
  pageSize?: number;
  estado?: 'ACTIVO' | 'INACTIVO';
  search?: string;
}

export interface CampoFormValues {
  nombre: string;
  ubicacion: string;
  superficieHa: number;
  latitud?: number;
  longitud?: number;
  responsableId?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
  observaciones?: string;
}

export const camposApi = {
  list: (params: ListCamposParams) =>
    api.get<PaginatedResponse<Campo>>('/campos', { params }).then((r) => r.data),

  getById: (id: string) => api.get<Campo>(`/campos/${id}`).then((r) => r.data),

  create: (values: CampoFormValues) => api.post<Campo>('/campos', values).then((r) => r.data),

  update: (id: string, values: Partial<CampoFormValues>) =>
    api.patch<Campo>(`/campos/${id}`, values).then((r) => r.data),

  delete: (id: string) => api.delete(`/campos/${id}`),

  listNotas: (campoId: string) => api.get<CampoNota[]>(`/campos/${campoId}/notas`).then((r) => r.data),

  createNota: (campoId: string, values: { titulo: string; descripcion: string }) =>
    api.post<CampoNota>(`/campos/${campoId}/notas`, values).then((r) => r.data),

  addNotaAdjunto: (campoId: string, notaId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post(`/campos/${campoId}/notas/${notaId}/adjuntos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  listDocumentos: (campoId: string) =>
    api.get<CampoDocumento[]>(`/campos/${campoId}/documentos`).then((r) => r.data),

  uploadDocumento: (campoId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post<CampoDocumento>(`/campos/${campoId}/documentos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  listFotos: (campoId: string) => api.get<CampoFoto[]>(`/campos/${campoId}/fotos`).then((r) => r.data),

  uploadFoto: (campoId: string, file: File, descripcion?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (descripcion) formData.append('descripcion', descripcion);
    return api
      .post<CampoFoto>(`/campos/${campoId}/fotos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};
