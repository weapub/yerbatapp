import path from 'node:path';

/**
 * Raíz del repo (carpeta que contiene client/, server/, database/, uploads/…),
 * calculada UNA sola vez a partir de la ubicación de este archivo, para que
 * ningún otro módulo tenga que volver a contar niveles de "../" a mano (esa
 * cuenta manual fue la causa de un bug real: uploads/backups terminaban
 * escribiéndose dentro de server/ en vez de en la raíz documentada).
 *
 * Este archivo vive en server/src/shared/utils/paths.ts tanto en desarrollo
 * (tsx corre el .ts directo) como compilado (tsc preserva la misma estructura
 * bajo server/dist/), así que "4 niveles arriba" da la raíz del repo en ambos casos.
 */
export const REPO_ROOT = path.resolve(__dirname, '../../../../');

export const resolveFromRepoRoot = (...segments: string[]): string => path.join(REPO_ROOT, ...segments);
