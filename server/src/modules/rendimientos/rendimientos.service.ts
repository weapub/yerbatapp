import { Prisma } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError';
import { buildPaginationMeta, PaginatedResult } from '../../shared/utils/pagination';
import { toRendimientoDto } from './rendimientos.dto';
import { rendimientosRepository } from './rendimientos.repository';
import {
  ComparativaQuery,
  CreateRendimientoInput,
  ListRendimientosQuery,
  UpdateRendimientoInput,
} from './rendimientos.validation';

const getRendimientoOrThrow = async (id: string, tenantId: string) => {
  const rendimiento = await rendimientosRepository.findByIdInTenant(id, tenantId);
  if (!rendimiento) throw AppError.notFound('Rendimiento no encontrado');
  return rendimiento;
};

const buildComparativaWhere = (
  tenantId: string,
  query: Pick<ComparativaQuery, 'campaniaId' | 'campoId' | 'cultivoId'>,
): Prisma.RendimientoWhereInput => ({
  campo: { tenantId },
  ...(query.campaniaId ? { campaniaId: query.campaniaId } : {}),
  ...(query.campoId ? { campoId: query.campoId } : {}),
  ...(query.cultivoId ? { cultivoId: query.cultivoId } : {}),
});

export const rendimientosService = {
  async list(
    tenantId: string,
    query: ListRendimientosQuery,
  ): Promise<PaginatedResult<ReturnType<typeof toRendimientoDto>>> {
    const { data, total } = await rendimientosRepository.findManyPaginated(tenantId, query);
    return { data: data.map(toRendimientoDto), meta: buildPaginationMeta(total, query) };
  },

  async getById(id: string, tenantId: string) {
    const rendimiento = await getRendimientoOrThrow(id, tenantId);
    return toRendimientoDto(rendimiento);
  },

  async create(tenantId: string, input: CreateRendimientoInput) {
    const campo = await rendimientosRepository.findCampoInTenant(input.campoId, tenantId);
    if (!campo) throw AppError.notFound('Campo no encontrado');

    const cultivo = await rendimientosRepository.findCultivoInCampo(input.cultivoId, input.campoId);
    if (!cultivo) throw AppError.notFound('El cultivo no pertenece a ese campo');

    const campania = await rendimientosRepository.findCampaniaInTenant(input.campaniaId, tenantId);
    if (!campania) throw AppError.notFound('Campaña no encontrada');

    const superficieHa = Number(campo.superficieHa);
    const rendimientoHa = superficieHa > 0 ? input.produccion / superficieHa : 0;

    const rendimiento = await rendimientosRepository.create({
      fecha: input.fecha,
      produccion: input.produccion,
      unidad: input.unidad,
      costo: input.costo,
      ingreso: input.ingreso,
      rendimientoHa,
      campo: { connect: { id: input.campoId } },
      cultivo: { connect: { id: input.cultivoId } },
      campania: { connect: { id: input.campaniaId } },
    });
    return toRendimientoDto(rendimiento);
  },

  async update(id: string, tenantId: string, input: UpdateRendimientoInput) {
    const existing = await getRendimientoOrThrow(id, tenantId);

    let rendimientoHa: number | undefined;
    if (input.produccion !== undefined) {
      const superficieHa = Number(existing.campo.superficieHa);
      rendimientoHa = superficieHa > 0 ? input.produccion / superficieHa : 0;
    }

    const rendimiento = await rendimientosRepository.update(id, {
      ...input,
      ...(rendimientoHa !== undefined ? { rendimientoHa } : {}),
    });
    return toRendimientoDto(rendimiento);
  },

  async delete(id: string, tenantId: string): Promise<void> {
    await getRendimientoOrThrow(id, tenantId);
    await rendimientosRepository.delete(id);
  },

  async comparativa(tenantId: string, query: ComparativaQuery) {
    const where = buildComparativaWhere(tenantId, query);

    if (query.groupBy === 'campo') {
      const rows = await rendimientosRepository.groupByCampo(where);
      const campos = await rendimientosRepository.findCamposByIds(rows.map((r) => r.campoId));
      const nameById = new Map(campos.map((c) => [c.id, c.nombre]));
      return rows.map((row) => buildComparativaRow(row.campoId, nameById.get(row.campoId) ?? '—', row));
    }

    if (query.groupBy === 'cultivo') {
      const rows = await rendimientosRepository.groupByCultivo(where);
      const cultivos = await rendimientosRepository.findCultivosByIds(rows.map((r) => r.cultivoId));
      const nameById = new Map(cultivos.map((c) => [c.id, c.nombre]));
      return rows.map((row) => buildComparativaRow(row.cultivoId, nameById.get(row.cultivoId) ?? '—', row));
    }

    const rows = await rendimientosRepository.groupByCampania(where);
    const campanias = await rendimientosRepository.findCampaniasByIds(rows.map((r) => r.campaniaId));
    const nameById = new Map(campanias.map((c) => [c.id, c.nombre]));
    return rows.map((row) => buildComparativaRow(row.campaniaId, nameById.get(row.campaniaId) ?? '—', row));
  },
};

interface GroupedRow {
  _sum: { produccion: Prisma.Decimal | null; costo: Prisma.Decimal | null; ingreso: Prisma.Decimal | null };
  _avg: { rendimientoHa: Prisma.Decimal | null };
}

const buildComparativaRow = (key: string, label: string, row: GroupedRow) => {
  const totalProduccion = Number(row._sum.produccion ?? 0);
  const totalCosto = Number(row._sum.costo ?? 0);
  const totalIngreso = Number(row._sum.ingreso ?? 0);
  const rentabilidad = totalIngreso - totalCosto;

  return {
    key,
    label,
    totalProduccion,
    totalCosto,
    totalIngreso,
    rentabilidad,
    rendimientoPromedioHa: Number(row._avg.rendimientoHa ?? 0),
  };
};
