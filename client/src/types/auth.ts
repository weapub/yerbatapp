export type RolUsuario = 'ADMIN' | 'SUPERVISOR' | 'EMPLEADO';

export interface SafeUser {
  id: string;
  tenantId: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  ultimoAcceso: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: SafeUser;
}
