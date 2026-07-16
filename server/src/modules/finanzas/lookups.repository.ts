import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';

export const cuentasRepository = {
  findManyByTenant: (tenantId: string) => prisma.cuentaFinanciera.findMany({ where: { tenantId }, orderBy: { nombre: 'asc' } }),

  findByIdInTenant: (id: string, tenantId: string) => prisma.cuentaFinanciera.findFirst({ where: { id, tenantId } }),

  create: (data: Prisma.CuentaFinancieraCreateInput) => prisma.cuentaFinanciera.create({ data }),

  update: (id: string, data: Prisma.CuentaFinancieraUpdateInput) =>
    prisma.cuentaFinanciera.update({ where: { id }, data }),

  delete: (id: string) => prisma.cuentaFinanciera.delete({ where: { id } }),

  sumMovimientos: (cuentaId: string) =>
    prisma.movimientoFinanciero.groupBy({ by: ['tipo'], where: { cuentaId }, _sum: { monto: true } }),
};

export const categoriasRepository = {
  findManyByTenant: (tenantId: string) =>
    prisma.categoriaFinanciera.findMany({ where: { tenantId }, orderBy: { nombre: 'asc' } }),

  findByIdInTenant: (id: string, tenantId: string) => prisma.categoriaFinanciera.findFirst({ where: { id, tenantId } }),

  create: (data: Prisma.CategoriaFinancieraCreateInput) => prisma.categoriaFinanciera.create({ data }),

  update: (id: string, data: Prisma.CategoriaFinancieraUpdateInput) =>
    prisma.categoriaFinanciera.update({ where: { id }, data }),

  delete: (id: string) => prisma.categoriaFinanciera.delete({ where: { id } }),
};

export const centrosCostoRepository = {
  findManyByTenant: (tenantId: string) => prisma.centroCosto.findMany({ where: { tenantId }, orderBy: { nombre: 'asc' } }),

  findByIdInTenant: (id: string, tenantId: string) => prisma.centroCosto.findFirst({ where: { id, tenantId } }),

  create: (data: Prisma.CentroCostoCreateInput) => prisma.centroCosto.create({ data }),

  update: (id: string, data: Prisma.CentroCostoUpdateInput) => prisma.centroCosto.update({ where: { id }, data }),

  delete: (id: string) => prisma.centroCosto.delete({ where: { id } }),
};
