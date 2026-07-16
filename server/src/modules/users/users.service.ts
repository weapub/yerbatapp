import { AppError } from '../../shared/errors/AppError';
import { hashPassword } from '../../shared/utils/hash';
import { SafeUserDto, toSafeUser } from '../auth/auth.dto';
import { usersRepository } from './users.repository';
import { CreateUserInput, UpdateUserInput } from './users.validation';

export const usersService = {
  async list(tenantId: string): Promise<SafeUserDto[]> {
    const users = await usersRepository.findManyByTenant(tenantId);
    return users.map(toSafeUser);
  },

  async getById(id: string, tenantId: string): Promise<SafeUserDto> {
    const user = await usersRepository.findByIdInTenant(id, tenantId);
    if (!user) throw AppError.notFound('Usuario no encontrado');
    return toSafeUser(user);
  },

  async create(tenantId: string, input: CreateUserInput): Promise<SafeUserDto> {
    const existing = await usersRepository.findByEmail(input.email);
    if (existing) throw AppError.conflict('Ya existe un usuario con ese email');

    const passwordHash = await hashPassword(input.password);
    const user = await usersRepository.create({
      nombre: input.nombre,
      email: input.email,
      passwordHash,
      rol: input.rol,
      tenant: { connect: { id: tenantId } },
    });
    return toSafeUser(user);
  },

  async update(id: string, tenantId: string, input: UpdateUserInput): Promise<SafeUserDto> {
    const existing = await usersRepository.findByIdInTenant(id, tenantId);
    if (!existing) throw AppError.notFound('Usuario no encontrado');

    const user = await usersRepository.update(id, input);
    return toSafeUser(user);
  },

  async deactivate(id: string, tenantId: string, requesterId: string): Promise<void> {
    if (id === requesterId) throw AppError.badRequest('No podés desactivar tu propio usuario');
    const existing = await usersRepository.findByIdInTenant(id, tenantId);
    if (!existing) throw AppError.notFound('Usuario no encontrado');
    await usersRepository.deactivate(id);
  },
};
