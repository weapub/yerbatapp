import { RolUsuario, User } from '@prisma/client';

export interface SafeUserDto {
  id: string;
  tenantId: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  ultimoAcceso: Date | null;
}

export const toSafeUser = (user: User): SafeUserDto => ({
  id: user.id,
  tenantId: user.tenantId,
  nombre: user.nombre,
  email: user.email,
  rol: user.rol,
  activo: user.activo,
  ultimoAcceso: user.ultimoAcceso,
});

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponseDto extends AuthTokensDto {
  user: SafeUserDto;
}
