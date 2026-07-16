import { api } from '@/lib/axios';
import { ReporteResult, TipoReporte } from '@/types/reportes';

export interface ReporteParams {
  desde?: string;
  hasta?: string;
}

export const reportesApi = {
  generar: (tipo: TipoReporte, params: ReporteParams) =>
    api.get<ReporteResult>(`/reportes/${tipo}`, { params }).then((r) => r.data),

  exportar: async (tipo: TipoReporte, params: ReporteParams, formato: 'csv' | 'excel' | 'pdf') => {
    const response = await api.get(`/reportes/${tipo}/exportar`, {
      params: { ...params, formato },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    const ext = formato === 'excel' ? 'xlsx' : formato;
    link.href = url;
    link.download = `${tipo}_${new Date().toISOString().slice(0, 10)}.${ext}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
