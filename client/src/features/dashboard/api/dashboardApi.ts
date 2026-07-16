import { api } from '@/lib/axios';

export interface DashboardResumen {
  totalCampos: number;
  superficieTotalHa: number;
  totalCultivos: number;
  tareasPendientes: number;
  alertas: number;
  cultivosPorEstadoSanitario: { estado: string; cantidad: number }[];
  camposPorEstado: { estado: string; cantidad: number }[];
  cultivosPorCampo: { campoId: string; nombre: string; superficieHa: number; cantidadCultivos: number }[];
  actividadReciente: { id: string; titulo: string; campo: string; usuario: string; fecha: string }[];
  modulosPendientes: string[];
}

export const dashboardApi = {
  getResumen: () => api.get<DashboardResumen>('/dashboard/resumen').then((r) => r.data),
};
