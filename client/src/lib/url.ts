const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

/** Origen del servidor (sin el prefijo /api/v1), para resolver URLs de /uploads devueltas por la API. */
export const serverOrigin = apiUrl.replace(/\/api\/v\d+\/?$/, '');

export const resolveFileUrl = (relativeUrl: string): string =>
  relativeUrl.startsWith('http') ? relativeUrl : `${serverOrigin}${relativeUrl}`;
