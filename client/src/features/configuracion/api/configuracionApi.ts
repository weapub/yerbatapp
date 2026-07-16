import { api } from '@/lib/axios';
import { BackupLog, EmpresaConfig, ParametroSistema } from '@/types/configuracion';

export interface UpdateEmpresaValues {
  razonSocial?: string;
  cuit?: string;
  direccion?: string;
  telefono?: string;
  ivaGeneral?: number;
}

export const configuracionApi = {
  getEmpresa: () => api.get<EmpresaConfig>('/configuracion/empresa').then((r) => r.data),

  updateEmpresa: (values: UpdateEmpresaValues) =>
    api.patch<EmpresaConfig>('/configuracion/empresa', values).then((r) => r.data),

  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post<EmpresaConfig>('/configuracion/empresa/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  listParametros: () => api.get<ParametroSistema[]>('/configuracion/parametros').then((r) => r.data),

  upsertParametro: (clave: string, valor: string) =>
    api.put<ParametroSistema>(`/configuracion/parametros/${encodeURIComponent(clave)}`, { valor }).then((r) => r.data),

  deleteParametro: (clave: string) => api.delete(`/configuracion/parametros/${encodeURIComponent(clave)}`),
};

export const backupsApi = {
  list: () => api.get<BackupLog[]>('/backups').then((r) => r.data),

  crear: () => api.post<BackupLog>('/backups').then((r) => r.data),

  descargar: async (id: string) => {
    const response = await api.get(`/backups/${id}/descargar`, { responseType: 'blob' });
    const disposition = response.headers['content-disposition'] as string | undefined;
    const match = disposition?.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] ?? 'backup.sql';
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  restaurar: (id: string) => api.post(`/backups/${id}/restaurar`, { confirmar: 'RESTAURAR' }),
};
