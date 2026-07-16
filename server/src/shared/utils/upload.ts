import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import { env } from '../../config/env';
import { resolveFromRepoRoot } from './paths';

const uploadsRoot = resolveFromRepoRoot(env.UPLOADS_DIR);

const ensureSubdir = (subdir: string): string => {
  const dir = path.join(uploadsRoot, subdir);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

/** Crea un middleware de Multer que guarda archivos en uploads/<subdir>/. */
export const uploader = (subdir: string) =>
  multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, ensureSubdir(subdir)),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuid()}${ext}`);
      },
    }),
    limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
  });

export const publicUrlFor = (subdir: string, filename: string): string => `/uploads/${subdir}/${filename}`;
