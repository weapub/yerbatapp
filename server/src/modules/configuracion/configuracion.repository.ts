import { prisma } from '../../prisma/client';

interface EmpresaConfigFields {
  razonSocial?: string;
  cuit?: string;
  direccion?: string;
  telefono?: string;
  ivaGeneral?: number;
  logoUrl?: string;
}

export const configuracionRepository = {
  findEmpresaConfig: (tenantId: string) => prisma.empresaConfig.findUnique({ where: { tenantId } }),

  upsertEmpresaConfig: (tenantId: string, data: EmpresaConfigFields, razonSocialPorDefecto: string) =>
    prisma.empresaConfig.upsert({
      where: { tenantId },
      update: data,
      create: { tenant: { connect: { id: tenantId } }, razonSocial: razonSocialPorDefecto, ...data },
    }),

  findTenantById: (tenantId: string) => prisma.tenant.findUnique({ where: { id: tenantId } }),

  updateTenantLogo: (tenantId: string, logoUrl: string) =>
    prisma.tenant.update({ where: { id: tenantId }, data: { logoUrl } }),

  findParametros: (tenantId: string) =>
    prisma.parametroSistema.findMany({ where: { tenantId }, orderBy: { clave: 'asc' } }),

  upsertParametro: (tenantId: string, clave: string, valor: string) =>
    prisma.parametroSistema.upsert({
      where: { tenantId_clave: { tenantId, clave } },
      update: { valor },
      create: { tenant: { connect: { id: tenantId } }, clave, valor },
    }),

  deleteParametro: (tenantId: string, clave: string) =>
    prisma.parametroSistema.delete({ where: { tenantId_clave: { tenantId, clave } } }),
};
