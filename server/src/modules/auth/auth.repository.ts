import { prisma } from '../../prisma/client';

export const authRepository = {
  findUserByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),

  findUserById: (id: string) => prisma.user.findUnique({ where: { id } }),

  touchLastLogin: (userId: string) =>
    prisma.user.update({ where: { id: userId }, data: { ultimoAcceso: new Date() } }),

  recordLoginHistory: (userId: string, ip: string | undefined, userAgent: string | undefined, exitoso: boolean) =>
    prisma.loginHistory.create({ data: { userId, ip, userAgent, exitoso } }),

  createRefreshToken: (userId: string, tokenHash: string, expiresAt: Date) =>
    prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } }),

  findRefreshTokenByHash: (tokenHash: string) => prisma.refreshToken.findUnique({ where: { tokenHash } }),

  revokeRefreshToken: (id: string) =>
    prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } }),

  createPasswordResetToken: (userId: string, tokenHash: string, expiresAt: Date) =>
    prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } }),

  findPasswordResetTokenByHash: (tokenHash: string) =>
    prisma.passwordResetToken.findUnique({ where: { tokenHash } }),

  markPasswordResetTokenUsed: (id: string) =>
    prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } }),

  updatePassword: (userId: string, passwordHash: string) =>
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),

  findLoginHistory: (userId: string, take = 20) =>
    prisma.loginHistory.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take }),
};
