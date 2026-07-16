import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';

export const backupsRepository = {
  findManyByTenant: (tenantId: string) =>
    prisma.backupLog.findMany({ where: { tenantId }, orderBy: { iniciadoEn: 'desc' } }),

  findByIdInTenant: (id: string, tenantId: string) => prisma.backupLog.findFirst({ where: { id, tenantId } }),

  create: (data: Prisma.BackupLogCreateInput) => prisma.backupLog.create({ data }),

  update: (id: string, data: Prisma.BackupLogUpdateInput) => prisma.backupLog.update({ where: { id }, data }),
};
