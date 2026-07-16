import { api } from '@/lib/axios';
import { RolUsuario, SafeUser } from '@/types/auth';

export interface CreateUserValues {
  nombre: string;
  email: string;
  password: string;
  rol: RolUsuario;
}

export interface UpdateUserValues {
  nombre?: string;
  rol?: RolUsuario;
  activo?: boolean;
}

export const usersApi = {
  list: () => api.get<SafeUser[]>('/users').then((r) => r.data),
  create: (values: CreateUserValues) => api.post<SafeUser>('/users', values).then((r) => r.data),
  update: (id: string, values: UpdateUserValues) =>
    api.patch<SafeUser>(`/users/${id}`, values).then((r) => r.data),
  deactivate: (id: string) => api.delete(`/users/${id}`),
};
