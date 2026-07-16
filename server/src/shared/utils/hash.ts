import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { env } from '../../config/env';

export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);

export const comparePassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

/** Hash determinístico (sha256) para tokens opacos como refresh/reset tokens: se guarda solo el hash en DB. */
export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
