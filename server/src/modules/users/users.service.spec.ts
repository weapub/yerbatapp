import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RolUsuario } from '@prisma/client';

vi.mock('../../prisma/client', () => ({ prisma: {} }));

vi.mock('./users.repository', () => ({
  usersRepository: {
    findManyByTenant: vi.fn(),
    findByIdInTenant: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
  },
}));

import { usersRepository } from './users.repository';
import { usersService } from './users.service';

const tenantId = 'tenant-1';

const dbUser = {
  id: 'user-2',
  tenantId,
  nombre: 'Empleado',
  email: 'empleado@yerbatapp.com',
  passwordHash: 'hash',
  rol: RolUsuario.EMPLEADO,
  activo: true,
  ultimoAcceso: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('usersService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('crea un usuario nuevo si el email no existe', async () => {
    vi.mocked(usersRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(usersRepository.create).mockResolvedValue(dbUser as never);

    const result = await usersService.create(tenantId, {
      nombre: 'Empleado',
      email: 'empleado@yerbatapp.com',
      password: 'Secreta123',
      rol: RolUsuario.EMPLEADO,
    });

    expect(result.email).toBe('empleado@yerbatapp.com');
    expect((result as unknown as { passwordHash?: string }).passwordHash).toBeUndefined();
  });

  it('rechaza crear un usuario con email duplicado', async () => {
    vi.mocked(usersRepository.findByEmail).mockResolvedValue(dbUser as never);

    await expect(
      usersService.create(tenantId, {
        nombre: 'Otro',
        email: 'empleado@yerbatapp.com',
        password: 'Secreta123',
        rol: RolUsuario.EMPLEADO,
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('no permite que un usuario se desactive a sí mismo', async () => {
    vi.mocked(usersRepository.findByIdInTenant).mockResolvedValue(dbUser as never);

    await expect(usersService.deactivate('user-2', tenantId, 'user-2')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('lanza 404 al actualizar un usuario inexistente', async () => {
    vi.mocked(usersRepository.findByIdInTenant).mockResolvedValue(null);

    await expect(usersService.update('no-existe', tenantId, { nombre: 'X' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
