import { AppError } from '../errors/AppError';

/**
 * Lee un parámetro de ruta ya validado por el middleware `validate` (Zod).
 * Con `noUncheckedIndexedAccess` activo, TS tipa req.params[key] como
 * `string | undefined`; en runtime siempre está presente porque la ruta no
 * matchea sin él, así que esto solo hace el chequeo explícito para el compilador.
 */
export const requireParam = (params: Record<string, string | undefined>, key: string): string => {
  const value = params[key];
  if (!value) throw AppError.badRequest(`Falta el parámetro de ruta "${key}"`);
  return value;
};
