import { Prisma, TipoMovimientoFinanciero } from '@prisma/client';
import { movimientosRepository } from './movimientos.repository';
import { FlujoCajaQuery, RangoFechasQuery } from './finanzas.validation';

const buildWhere = (query: Pick<RangoFechasQuery, 'desde' | 'hasta' | 'cuentaId'>): Prisma.MovimientoFinancieroWhereInput => ({
  fecha: { gte: query.desde, lte: query.hasta },
  ...(query.cuentaId ? { cuentaId: query.cuentaId } : {}),
});

/**
 * Balance de un rango de fechas (sirve tanto para "balance mensual" como "anual":
 * el cliente simplemente pasa el rango correspondiente). La "rentabilidad" del
 * período es ingresos - egresos.
 */
export const reportesService = {
  async balance(tenantId: string, query: RangoFechasQuery) {
    const movimientos = await movimientosRepository.findManyForReporte(tenantId, buildWhere(query));

    let ingresos = 0;
    let egresos = 0;
    const porCategoriaMap = new Map<string, { nombre: string; tipo: TipoMovimientoFinanciero; total: number }>();

    for (const m of movimientos) {
      const monto = Number(m.monto);
      if (m.tipo === 'INGRESO') ingresos += monto;
      else egresos += monto;

      const entry = porCategoriaMap.get(m.categoriaId) ?? { nombre: m.categoria.nombre, tipo: m.tipo, total: 0 };
      entry.total += monto;
      porCategoriaMap.set(m.categoriaId, entry);
    }

    return {
      ingresos: Number(ingresos.toFixed(2)),
      egresos: Number(egresos.toFixed(2)),
      rentabilidad: Number((ingresos - egresos).toFixed(2)),
      porCategoria: Array.from(porCategoriaMap.entries()).map(([categoriaId, v]) => ({
        categoriaId,
        nombre: v.nombre,
        tipo: v.tipo,
        total: Number(v.total.toFixed(2)),
      })),
    };
  },

  /**
   * Flujo de caja: ingresos/egresos agrupados por día o mes dentro del rango, con
   * saldo acumulado relativo al inicio del rango (no incluye el saldoInicial de la
   * cuenta, que se muestra aparte en GET /finanzas/cuentas).
   */
  async flujoCaja(tenantId: string, query: FlujoCajaQuery) {
    const movimientos = await movimientosRepository.findManyForReporte(tenantId, buildWhere(query));

    // Usamos siempre los getters UTC: las fechas llegan parseadas en UTC (z.coerce.date()
    // sobre strings "YYYY-MM-DD"), y mezclarlos con getters locales corre el período un día
    // (o un mes) en zonas horarias negativas como Argentina (UTC-3).
    const periodoKey = (fecha: Date) =>
      query.groupBy === 'dia'
        ? fecha.toISOString().slice(0, 10)
        : `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`;

    const porPeriodo = new Map<string, { ingresos: number; egresos: number }>();
    for (const m of movimientos) {
      const key = periodoKey(m.fecha);
      const entry = porPeriodo.get(key) ?? { ingresos: 0, egresos: 0 };
      const monto = Number(m.monto);
      if (m.tipo === 'INGRESO') entry.ingresos += monto;
      else entry.egresos += monto;
      porPeriodo.set(key, entry);
    }

    let acumulado = 0;
    return Array.from(porPeriodo.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([periodo, { ingresos, egresos }]) => {
        acumulado += ingresos - egresos;
        return {
          periodo,
          ingresos: Number(ingresos.toFixed(2)),
          egresos: Number(egresos.toFixed(2)),
          saldoAcumulado: Number(acumulado.toFixed(2)),
        };
      });
  },
};
