import { AppError } from '../../shared/errors/AppError';
import { categoriasRepository, centrosCostoRepository, cuentasRepository } from './lookups.repository';
import {
  CreateCategoriaInput,
  CreateCentroCostoInput,
  CreateCuentaInput,
  UpdateCategoriaInput,
  UpdateCentroCostoInput,
  UpdateCuentaInput,
} from './finanzas.validation';

const toCuentaDto = async (cuenta: { id: string; nombre: string; tipo: string; saldoInicial: unknown; createdAt: Date }) => {
  const sumas = await cuentasRepository.sumMovimientos(cuenta.id);
  const ingresos = Number(sumas.find((s) => s.tipo === 'INGRESO')?._sum.monto ?? 0);
  const egresos = Number(sumas.find((s) => s.tipo === 'EGRESO')?._sum.monto ?? 0);
  const saldoInicial = Number(cuenta.saldoInicial);

  return { ...cuenta, saldoInicial, saldoActual: Number((saldoInicial + ingresos - egresos).toFixed(2)) };
};

export const cuentasService = {
  async list(tenantId: string) {
    const cuentas = await cuentasRepository.findManyByTenant(tenantId);
    return Promise.all(cuentas.map(toCuentaDto));
  },

  async create(tenantId: string, input: CreateCuentaInput) {
    const cuenta = await cuentasRepository.create({
      nombre: input.nombre,
      tipo: input.tipo,
      saldoInicial: input.saldoInicial,
      tenant: { connect: { id: tenantId } },
    });
    return toCuentaDto(cuenta);
  },

  async update(id: string, tenantId: string, input: UpdateCuentaInput) {
    const existing = await cuentasRepository.findByIdInTenant(id, tenantId);
    if (!existing) throw AppError.notFound('Cuenta no encontrada');
    const cuenta = await cuentasRepository.update(id, input);
    return toCuentaDto(cuenta);
  },

  async delete(id: string, tenantId: string): Promise<void> {
    const existing = await cuentasRepository.findByIdInTenant(id, tenantId);
    if (!existing) throw AppError.notFound('Cuenta no encontrada');
    await cuentasRepository.delete(id);
  },
};

export const categoriasService = {
  list: (tenantId: string) => categoriasRepository.findManyByTenant(tenantId),

  create: (tenantId: string, input: CreateCategoriaInput) =>
    categoriasRepository.create({ nombre: input.nombre, tipo: input.tipo, tenant: { connect: { id: tenantId } } }),

  async update(id: string, tenantId: string, input: UpdateCategoriaInput) {
    const existing = await categoriasRepository.findByIdInTenant(id, tenantId);
    if (!existing) throw AppError.notFound('Categoría no encontrada');
    return categoriasRepository.update(id, input);
  },

  async delete(id: string, tenantId: string): Promise<void> {
    const existing = await categoriasRepository.findByIdInTenant(id, tenantId);
    if (!existing) throw AppError.notFound('Categoría no encontrada');
    await categoriasRepository.delete(id);
  },
};

export const centrosCostoService = {
  list: (tenantId: string) => centrosCostoRepository.findManyByTenant(tenantId),

  create: (tenantId: string, input: CreateCentroCostoInput) =>
    centrosCostoRepository.create({ nombre: input.nombre, tenant: { connect: { id: tenantId } } }),

  async update(id: string, tenantId: string, input: UpdateCentroCostoInput) {
    const existing = await centrosCostoRepository.findByIdInTenant(id, tenantId);
    if (!existing) throw AppError.notFound('Centro de costo no encontrado');
    return centrosCostoRepository.update(id, input);
  },

  async delete(id: string, tenantId: string): Promise<void> {
    const existing = await centrosCostoRepository.findByIdInTenant(id, tenantId);
    if (!existing) throw AppError.notFound('Centro de costo no encontrado');
    await centrosCostoRepository.delete(id);
  },
};
