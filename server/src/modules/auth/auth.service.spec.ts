import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RolUsuario } from '@prisma/client';

vi.mock('../../prisma/client', () => ({ prisma: {} }));

vi.mock('./auth.repository', () => ({
  authRepository: {
    findUserByEmail: vi.fn(),
    findUserById: vi.fn(),
    touchLastLogin: vi.fn(),
    recordLoginHistory: vi.fn(),
    createRefreshToken: vi.fn(),
    findRefreshTokenByHash: vi.fn(),
    revokeRefreshToken: vi.fn(),
    createPasswordResetToken: vi.fn(),
    findPasswordResetTokenByHash: vi.fn(),
    markPasswordResetTokenUsed: vi.fn(),
    updatePassword: vi.fn(),
  },
}));

vi.mock('../../shared/utils/mailer', () => ({ mailer: { send: vi.fn() } }));

import { authRepository } from './auth.repository';
import { authService } from './auth.service';
import { hashPassword } from '../../shared/utils/hash';

const baseUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  nombre: 'Admin',
  email: 'admin@yerbatapp.com',
  rol: RolUsuario.ADMIN,
  activo: true,
  ultimoAcceso: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('authService.login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devuelve tokens y usuario sanitizado con credenciales válidas', async () => {
    const passwordHash = await hashPassword('Secreta123!');
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue({ ...baseUser, passwordHash } as never);

    const result = await authService.login('admin@yerbatapp.com', 'Secreta123!');

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.user.email).toBe('admin@yerbatapp.com');
    expect((result.user as unknown as { passwordHash?: string }).passwordHash).toBeUndefined();
    expect(authRepository.createRefreshToken).toHaveBeenCalledOnce();
    expect(authRepository.recordLoginHistory).toHaveBeenCalledWith('user-1', undefined, undefined, true);
  });

  it('rechaza credenciales inválidas sin filtrar si el usuario existe', async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null);

    await expect(authService.login('nadie@yerbatapp.com', 'x')).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('rechaza password incorrecta y registra el intento fallido', async () => {
    const passwordHash = await hashPassword('Secreta123!');
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue({ ...baseUser, passwordHash } as never);

    await expect(authService.login('admin@yerbatapp.com', 'incorrecta')).rejects.toMatchObject({
      statusCode: 401,
    });
    expect(authRepository.recordLoginHistory).toHaveBeenCalledWith('user-1', undefined, undefined, false);
  });

  it('rechaza usuarios inactivos', async () => {
    const passwordHash = await hashPassword('Secreta123!');
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue({
      ...baseUser,
      activo: false,
      passwordHash,
    } as never);

    await expect(authService.login('admin@yerbatapp.com', 'Secreta123!')).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});

describe('authService.resetPassword', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rechaza un token inexistente', async () => {
    vi.mocked(authRepository.findPasswordResetTokenByHash).mockResolvedValue(null);

    await expect(authService.resetPassword('token-invalido', 'NuevaPass123')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('rechaza un token ya usado', async () => {
    vi.mocked(authRepository.findPasswordResetTokenByHash).mockResolvedValue({
      id: 'reset-1',
      userId: 'user-1',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 10000),
      usedAt: new Date(),
      createdAt: new Date(),
    } as never);

    await expect(authService.resetPassword('token-usado', 'NuevaPass123')).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
