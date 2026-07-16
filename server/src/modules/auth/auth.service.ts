import { randomBytes } from 'node:crypto';
import ms from '../../shared/utils/ms';
import { AppError } from '../../shared/errors/AppError';
import { comparePassword, hashPassword, hashToken } from '../../shared/utils/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../shared/utils/jwt';
import { mailer } from '../../shared/utils/mailer';
import { env } from '../../config/env';
import { authRepository } from './auth.repository';
import { AuthTokensDto, LoginResponseDto, SafeUserDto, toSafeUser } from './auth.dto';

const REFRESH_EXPIRY_MS = ms(env.JWT_REFRESH_EXPIRES_IN);
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hora

const issueTokens = async (userId: string, tenantId: string, rol: SafeUserDto['rol']): Promise<AuthTokensDto> => {
  const accessToken = signAccessToken({ sub: userId, tenantId, rol });

  const jti = randomBytes(16).toString('hex');
  const refreshToken = signRefreshToken({ sub: userId, jti });
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS);
  await authRepository.createRefreshToken(userId, hashToken(refreshToken), expiresAt);

  return { accessToken, refreshToken };
};

export const authService = {
  async login(email: string, password: string, ip?: string, userAgent?: string): Promise<LoginResponseDto> {
    const user = await authRepository.findUserByEmail(email);

    if (!user || !user.activo) {
      if (user) await authRepository.recordLoginHistory(user.id, ip, userAgent, false);
      throw AppError.unauthorized('Credenciales inválidas');
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      await authRepository.recordLoginHistory(user.id, ip, userAgent, false);
      throw AppError.unauthorized('Credenciales inválidas');
    }

    await authRepository.recordLoginHistory(user.id, ip, userAgent, true);
    await authRepository.touchLastLogin(user.id);

    const tokens = await issueTokens(user.id, user.tenantId, user.rol);
    return { ...tokens, user: toSafeUser(user) };
  },

  async refresh(refreshToken: string): Promise<AuthTokensDto> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw AppError.unauthorized('Refresh token inválido o expirado');
    }

    const stored = await authRepository.findRefreshTokenByHash(hashToken(refreshToken));
    if (!stored || stored.revokedAt || stored.expiresAt < new Date() || stored.userId !== payload.sub) {
      throw AppError.unauthorized('Refresh token inválido o expirado');
    }

    const user = await authRepository.findUserById(payload.sub);
    if (!user || !user.activo) {
      throw AppError.unauthorized('Usuario inválido');
    }

    // Rotación: se revoca el token usado y se emite un par nuevo.
    await authRepository.revokeRefreshToken(stored.id);
    return issueTokens(user.id, user.tenantId, user.rol);
  },

  async logout(refreshToken: string): Promise<void> {
    const stored = await authRepository.findRefreshTokenByHash(hashToken(refreshToken));
    if (stored && !stored.revokedAt) {
      await authRepository.revokeRefreshToken(stored.id);
    }
  },

  async me(userId: string): Promise<SafeUserDto> {
    const user = await authRepository.findUserById(userId);
    if (!user) throw AppError.notFound('Usuario no encontrado');
    return toSafeUser(user);
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await authRepository.findUserByEmail(email);
    // Respuesta uniforme exista o no el usuario, para no filtrar qué emails están registrados.
    if (!user || !user.activo) return;

    const rawToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
    await authRepository.createPasswordResetToken(user.id, hashToken(rawToken), expiresAt);

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;
    await mailer.send(
      user.email,
      'Recuperación de contraseña — YerbatApp',
      `<p>Hola ${user.nombre},</p><p>Hacé clic para restablecer tu contraseña (válido 1 hora):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    );
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const stored = await authRepository.findPasswordResetTokenByHash(hashToken(token));
    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw AppError.badRequest('Token de recuperación inválido o expirado');
    }

    const passwordHash = await hashPassword(newPassword);
    await authRepository.updatePassword(stored.userId, passwordHash);
    await authRepository.markPasswordResetTokenUsed(stored.id);
  },
};
