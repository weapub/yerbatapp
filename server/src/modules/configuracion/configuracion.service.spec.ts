import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../prisma/client', () => ({ prisma: {} }));

vi.mock('./configuracion.repository', () => ({
  configuracionRepository: {
    findEmpresaConfig: vi.fn(),
    upsertEmpresaConfig: vi.fn(),
    findTenantById: vi.fn(),
    updateTenantLogo: vi.fn(),
    findParametros: vi.fn(),
    upsertParametro: vi.fn(),
    deleteParametro: vi.fn(),
  },
}));

import { configuracionRepository } from './configuracion.repository';
import { configuracionService } from './configuracion.service';

const tenantId = 'tenant-1';

describe('configuracionService.getEmpresa', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lanza 404 si no hay configuración de empresa para el tenant', async () => {
    vi.mocked(configuracionRepository.findEmpresaConfig).mockResolvedValue(null);

    await expect(configuracionService.getEmpresa(tenantId)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('convierte ivaGeneral (Decimal) a number', async () => {
    vi.mocked(configuracionRepository.findEmpresaConfig).mockResolvedValue({
      id: 'config-1',
      tenantId,
      razonSocial: 'Yerbatera Demo',
      ivaGeneral: { toString: () => '21' } as never,
    } as never);

    const result = await configuracionService.getEmpresa(tenantId);

    expect(result.ivaGeneral).toBe(21);
    expect(typeof result.ivaGeneral).toBe('number');
  });
});

describe('configuracionService.updateEmpresa', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lanza 404 si el tenant no existe', async () => {
    vi.mocked(configuracionRepository.findTenantById).mockResolvedValue(null);

    await expect(configuracionService.updateEmpresa(tenantId, { razonSocial: 'Nueva' })).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(configuracionRepository.upsertEmpresaConfig).not.toHaveBeenCalled();
  });
});
