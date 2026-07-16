import { api } from '@/lib/axios';
import { Campania } from '@/types/rendimientos';

export interface CampaniaFormValues {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
}

export const campaniasApi = {
  list: () => api.get<Campania[]>('/campanias').then((r) => r.data),
  create: (values: CampaniaFormValues) => api.post<Campania>('/campanias', values).then((r) => r.data),
  update: (id: string, values: Partial<CampaniaFormValues>) =>
    api.patch<Campania>(`/campanias/${id}`, values).then((r) => r.data),
  delete: (id: string) => api.delete(`/campanias/${id}`),
};
