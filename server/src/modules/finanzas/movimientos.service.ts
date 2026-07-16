import { AppError } from '../../shared/errors/AppError';
import { buildPaginationMeta, PaginatedResult } from '../../shared/utils/pagination';
import { toMovimientoDto } from './movimientos.dto';
import { movimientosRepository } from './movimientos.repository';
import { CreateMovimientoInput, ListMovimientosQuery, UpdateMovimientoInput } from './finanzas.validation';

const getMovimientoOrThrow = async (id: string, tenantId: string) => {
  const movimiento = await movimientosRepository.findByIdInTenant(id, tenantId);
  if (!movimiento) throw AppError.notFound('Movimiento no encontrado');
  return movimiento;
};

const assertRelacionesValidas = async (
  tenantId: string,
  input: Partial<Pick<CreateMovimientoInput, 'cuentaId' | 'categoriaId' | 'centroCostoId'>>,
) => {
  if (input.cuentaId) {
    const cuenta = await movimientosRepository.findCuentaInTenant(input.cuentaId, tenantId);
    if (!cuenta) throw AppError.notFound('Cuenta no encontrada');
  }

  if (input.categoriaId) {
    const categoria = await movimientosRepository.findCategoriaInTenant(input.categoriaId, tenantId);
    if (!categoria) throw AppError.notFound('Categoría no encontrada');
  }

  if (input.centroCostoId) {
    const centroCosto = await movimientosRepository.findCentroCostoInTenant(input.centroCostoId, tenantId);
    if (!centroCosto) throw AppError.notFound('Centro de costo no encontrado');
  }
};

export const movimientosService = {
  async list(
    tenantId: string,
    query: ListMovimientosQuery,
  ): Promise<PaginatedResult<ReturnType<typeof toMovimientoDto>>> {
    const { data, total } = await movimientosRepository.findManyPaginated(tenantId, query);
    return { data: data.map(toMovimientoDto), meta: buildPaginationMeta(total, query) };
  },

  async getById(id: string, tenantId: string) {
    return toMovimientoDto(await getMovimientoOrThrow(id, tenantId));
  },

  async create(tenantId: string, input: CreateMovimientoInput) {
    await assertRelacionesValidas(tenantId, {
      cuentaId: input.cuentaId,
      categoriaId: input.categoriaId,
      centroCostoId: input.centroCostoId,
    });

    const movimiento = await movimientosRepository.create({
      tipo: input.tipo,
      monto: input.monto,
      fecha: input.fecha,
      descripcion: input.descripcion,
      cuenta: { connect: { id: input.cuentaId } },
      categoria: { connect: { id: input.categoriaId } },
      ...(input.centroCostoId ? { centroCosto: { connect: { id: input.centroCostoId } } } : {}),
    });
    return toMovimientoDto(movimiento);
  },

  async update(id: string, tenantId: string, input: UpdateMovimientoInput) {
    await getMovimientoOrThrow(id, tenantId);

    const { cuentaId, categoriaId, centroCostoId, ...rest } = input;
    await assertRelacionesValidas(tenantId, { cuentaId, categoriaId, centroCostoId });

    const movimiento = await movimientosRepository.update(id, {
      ...rest,
      ...(cuentaId ? { cuenta: { connect: { id: cuentaId } } } : {}),
      ...(categoriaId ? { categoria: { connect: { id: categoriaId } } } : {}),
      ...(centroCostoId !== undefined
        ? { centroCosto: centroCostoId ? { connect: { id: centroCostoId } } : { disconnect: true } }
        : {}),
    });
    return toMovimientoDto(movimiento);
  },

  async delete(id: string, tenantId: string): Promise<void> {
    await getMovimientoOrThrow(id, tenantId);
    await movimientosRepository.delete(id);
  },

  async addAdjunto(id: string, tenantId: string, file: { url: string; nombreArchivo: string }) {
    await getMovimientoOrThrow(id, tenantId);
    return movimientosRepository.addAdjunto(id, file);
  },
};
