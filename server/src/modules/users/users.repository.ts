import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';

export const usersRepository = {
  findManyByTenant: (tenantId: string) =>
    prisma.user.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } }),

  findByIdInTenant: (id: string, tenantId: string) => prisma.user.findFirst({ where: { id, tenantId } }),

  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),

  create: (data: Prisma.UserCreateInput) => prisma.user.create({ data }),

  update: (id: string, data: Prisma.UserUpdateInput) => prisma.user.update({ where: { id }, data }),

  deactivate: (id: string) => prisma.user.update({ where: { id }, data: { activo: false } }),
};
