import { AppError } from '../../shared/errors/AppError';
import { configuracionRepository } from './configuracion.repository';
import { UpdateEmpresaInput } from './configuracion.validation';

const toEmpresaDto = (config: { ivaGeneral: unknown } & Record<string, unknown>) => ({
  ...config,
  ivaGeneral: Number(config.ivaGeneral),
});

export const configuracionService = {
  async getEmpresa(tenantId: string) {
    const config = await configuracionRepository.findEmpresaConfig(tenantId);
    if (!config) throw AppError.notFound('Configuración de empresa no encontrada');
    return toEmpresaDto(config);
  },

  async updateEmpresa(tenantId: string, input: UpdateEmpresaInput) {
    const tenant = await configuracionRepository.findTenantById(tenantId);
    if (!tenant) throw AppError.notFound('Tenant no encontrado');
    const config = await configuracionRepository.upsertEmpresaConfig(tenantId, input, tenant.nombre);
    return toEmpresaDto(config);
  },

  async updateLogo(tenantId: string, logoUrl: string) {
    const tenant = await configuracionRepository.findTenantById(tenantId);
    if (!tenant) throw AppError.notFound('Tenant no encontrado');
    await configuracionRepository.updateTenantLogo(tenantId, logoUrl);
    const config = await configuracionRepository.upsertEmpresaConfig(tenantId, { logoUrl }, tenant.nombre);
    return toEmpresaDto(config);
  },

  listParametros: (tenantId: string) => configuracionRepository.findParametros(tenantId),

  upsertParametro: (tenantId: string, clave: string, valor: string) =>
    configuracionRepository.upsertParametro(tenantId, clave, valor),

  async deleteParametro(tenantId: string, clave: string): Promise<void> {
    await configuracionRepository.deleteParametro(tenantId, clave);
  },
};
