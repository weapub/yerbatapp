import { TipoMovimientoFinanciero } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError';
import { ReportColumn, ReportRow } from '../../shared/utils/exporters';
import { rendimientosRepository } from '../rendimientos/rendimientos.repository';
import { insumosRepository } from '../insumos/insumos.repository';
import { camposRepository } from '../campos/campos.repository';
import { cultivosRepository } from '../cultivos/cultivos.repository';
import { proveedoresService } from '../proveedores/proveedores.service';
import { clientesService } from '../clientes/clientes.service';
import { facturasRepository } from '../facturas/facturas.repository';
import { movimientosRepository } from '../finanzas/movimientos.repository';
import { tareasRepository } from '../tareas/tareas.repository';
import { ivaService } from '../facturas/iva.service';
import { TipoReporte, ReporteQuery } from './reportes.validation';

const money = (v: unknown) => Number(v ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fecha = (v: unknown) => (v ? new Date(v as string).toLocaleDateString('es-AR') : '');
const FULL_PAGE = { page: 1, pageSize: 5000 };

const enRango = (fechaValor: Date, query: ReporteQuery): boolean => {
  if (query.desde && fechaValor < query.desde) return false;
  if (query.hasta && fechaValor > query.hasta) return false;
  return true;
};

export interface ReporteResult {
  titulo: string;
  columns: ReportColumn[];
  rows: ReportRow[];
}

const REPORT_TITLES: Record<TipoReporte, string> = {
  produccion: 'Producción',
  costos: 'Costos',
  rentabilidad: 'Rentabilidad',
  cultivos: 'Cultivos',
  campos: 'Campos',
  quimicos: 'Fertilizantes y Herbicidas',
  proveedores: 'Proveedores',
  clientes: 'Clientes',
  facturacion: 'Facturación',
  iva: 'Panel IVA',
  caja: 'Caja / Movimientos financieros',
  tareas: 'Tareas Agrícolas',
};

async function buildProduccionOrRentabilidad(tenantId: string, query: ReporteQuery): Promise<ReportRow[]> {
  const { data } = await rendimientosRepository.findManyPaginated(tenantId, FULL_PAGE);
  return data
    .filter((r) => enRango(r.fecha, query))
    .map((r) => ({
      fecha: r.fecha,
      campo: r.campo.nombre,
      cultivo: r.cultivo.nombre,
      campania: r.campania.nombre,
      produccion: Number(r.produccion),
      unidad: r.unidad,
      rendimientoHa: Number(r.rendimientoHa),
      costo: Number(r.costo),
      ingreso: Number(r.ingreso),
      rentabilidad: Number(r.ingreso) - Number(r.costo),
    }));
}

export const reportesService = {
  async generar(tenantId: string, tipo: TipoReporte, query: ReporteQuery): Promise<ReporteResult> {
    const titulo = REPORT_TITLES[tipo];

    switch (tipo) {
      case 'produccion': {
        const rows = await buildProduccionOrRentabilidad(tenantId, query);
        return {
          titulo,
          rows,
          columns: [
            { key: 'fecha', header: 'Fecha', format: fecha },
            { key: 'campo', header: 'Campo' },
            { key: 'cultivo', header: 'Cultivo' },
            { key: 'campania', header: 'Campaña' },
            { key: 'produccion', header: 'Producción' },
            { key: 'unidad', header: 'Unidad' },
            { key: 'rendimientoHa', header: 'Rinde/ha' },
          ],
        };
      }

      case 'rentabilidad': {
        const rows = await buildProduccionOrRentabilidad(tenantId, query);
        return {
          titulo,
          rows,
          columns: [
            { key: 'fecha', header: 'Fecha', format: fecha },
            { key: 'campo', header: 'Campo' },
            { key: 'cultivo', header: 'Cultivo' },
            { key: 'costo', header: 'Costo', format: money },
            { key: 'ingreso', header: 'Ingreso', format: money },
            { key: 'rentabilidad', header: 'Rentabilidad', format: money },
          ],
        };
      }

      case 'costos': {
        const { data } = await movimientosRepository.findManyPaginated(tenantId, {
          ...FULL_PAGE,
          tipo: TipoMovimientoFinanciero.EGRESO,
        });
        const rows = data
          .filter((m) => enRango(m.fecha, query))
          .map((m) => ({
            fecha: m.fecha,
            cuenta: m.cuenta.nombre,
            categoria: m.categoria.nombre,
            centroCosto: m.centroCosto?.nombre ?? '',
            monto: Number(m.monto),
            descripcion: m.descripcion ?? '',
          }));
        return {
          titulo,
          rows,
          columns: [
            { key: 'fecha', header: 'Fecha', format: fecha },
            { key: 'cuenta', header: 'Cuenta' },
            { key: 'categoria', header: 'Categoría' },
            { key: 'centroCosto', header: 'Centro de costo' },
            { key: 'monto', header: 'Monto', format: money },
            { key: 'descripcion', header: 'Descripción' },
          ],
        };
      }

      case 'caja': {
        const { data } = await movimientosRepository.findManyPaginated(tenantId, FULL_PAGE);
        const rows = data
          .filter((m) => enRango(m.fecha, query))
          .map((m) => ({
            fecha: m.fecha,
            cuenta: m.cuenta.nombre,
            tipo: m.tipo,
            categoria: m.categoria.nombre,
            monto: Number(m.monto),
          }));
        return {
          titulo,
          rows,
          columns: [
            { key: 'fecha', header: 'Fecha', format: fecha },
            { key: 'cuenta', header: 'Cuenta' },
            { key: 'tipo', header: 'Tipo' },
            { key: 'categoria', header: 'Categoría' },
            { key: 'monto', header: 'Monto', format: money },
          ],
        };
      }

      case 'cultivos': {
        const { data } = await cultivosRepository.findManyPaginated(tenantId, FULL_PAGE);
        const rows = data.map((c) => ({
          nombre: c.nombre,
          variedad: c.variedad ?? '',
          campo: c.campo.nombre,
          fechaPlantacion: c.fechaPlantacion,
          cantidadPlantas: c.cantidadPlantas,
          estadoSanitario: c.estadoSanitario,
        }));
        return {
          titulo,
          rows,
          columns: [
            { key: 'nombre', header: 'Cultivo' },
            { key: 'variedad', header: 'Variedad' },
            { key: 'campo', header: 'Campo' },
            { key: 'fechaPlantacion', header: 'Fecha plantación', format: fecha },
            { key: 'cantidadPlantas', header: 'Plantas' },
            { key: 'estadoSanitario', header: 'Estado sanitario' },
          ],
        };
      }

      case 'campos': {
        const { data } = await camposRepository.findManyPaginated(tenantId, FULL_PAGE);
        const rows = data.map((c) => ({
          nombre: c.nombre,
          ubicacion: c.ubicacion,
          superficieHa: Number(c.superficieHa),
          estado: c.estado,
          responsable: c.responsable?.nombre ?? '',
        }));
        return {
          titulo,
          rows,
          columns: [
            { key: 'nombre', header: 'Campo' },
            { key: 'ubicacion', header: 'Ubicación' },
            { key: 'superficieHa', header: 'Superficie (ha)' },
            { key: 'estado', header: 'Estado' },
            { key: 'responsable', header: 'Responsable' },
          ],
        };
      }

      case 'quimicos': {
        const { data } = await insumosRepository.findManyPaginated(tenantId, FULL_PAGE);
        const rows = data
          .filter((a) => enRango(a.fecha, query))
          .map((a) => ({
            fecha: a.fecha,
            tipo: a.tipo,
            campo: a.campo.nombre,
            cultivo: a.cultivo.nombre,
            producto: a.producto.nombre,
            proveedor: a.proveedor.empresa,
            dosisHa: Number(a.dosisHa),
            costo: Number(a.costo),
          }));
        return {
          titulo,
          rows,
          columns: [
            { key: 'fecha', header: 'Fecha', format: fecha },
            { key: 'tipo', header: 'Tipo' },
            { key: 'campo', header: 'Campo' },
            { key: 'cultivo', header: 'Cultivo' },
            { key: 'producto', header: 'Producto' },
            { key: 'proveedor', header: 'Proveedor' },
            { key: 'dosisHa', header: 'Dosis/ha' },
            { key: 'costo', header: 'Costo', format: money },
          ],
        };
      }

      case 'proveedores': {
        const { data } = await proveedoresService.list(tenantId, FULL_PAGE);
        const rows = (data as { empresa: string; cuit: string; telefono: string | null; email: string | null; saldo: number }[]).map(
          (p) => ({
            empresa: p.empresa,
            cuit: p.cuit,
            telefono: p.telefono ?? '',
            email: p.email ?? '',
            saldo: p.saldo,
          }),
        );
        return {
          titulo,
          rows,
          columns: [
            { key: 'empresa', header: 'Empresa' },
            { key: 'cuit', header: 'CUIT' },
            { key: 'telefono', header: 'Teléfono' },
            { key: 'email', header: 'Email' },
            { key: 'saldo', header: 'Saldo', format: money },
          ],
        };
      }

      case 'clientes': {
        const { data } = await clientesService.list(tenantId, FULL_PAGE);
        const rows = data.map((c) => ({
          razonSocial: c.razonSocial,
          cuit: c.cuit,
          telefono: c.telefono ?? '',
          email: c.email ?? '',
          saldo: c.saldo,
          totalVentas: c.totalVentas,
        }));
        return {
          titulo,
          rows,
          columns: [
            { key: 'razonSocial', header: 'Razón social' },
            { key: 'cuit', header: 'CUIT' },
            { key: 'telefono', header: 'Teléfono' },
            { key: 'email', header: 'Email' },
            { key: 'saldo', header: 'Saldo', format: money },
            { key: 'totalVentas', header: 'Ventas totales', format: money },
          ],
        };
      }

      case 'facturacion': {
        const { data } = await facturasRepository.findManyPaginated(tenantId, FULL_PAGE);
        const rows = data
          .filter((f) => enRango(f.fecha, query))
          .map((f) => ({
            fecha: f.fecha,
            tipo: f.tipo,
            operacion: f.operacion,
            numero: f.numero,
            cliente: f.cliente?.razonSocial ?? f.proveedor?.empresa ?? '',
            total: Number(f.total),
            estado: f.estado,
          }));
        return {
          titulo,
          rows,
          columns: [
            { key: 'fecha', header: 'Fecha', format: fecha },
            { key: 'tipo', header: 'Tipo' },
            { key: 'operacion', header: 'Operación' },
            { key: 'numero', header: 'Número' },
            { key: 'cliente', header: 'Cliente/Proveedor' },
            { key: 'total', header: 'Total', format: money },
            { key: 'estado', header: 'Estado' },
          ],
        };
      }

      case 'iva': {
        if (!query.desde || !query.hasta) {
          throw AppError.badRequest('El reporte de IVA requiere desde y hasta');
        }
        const panel = await ivaService.panel(tenantId, { desde: query.desde, hasta: query.hasta });
        const rows = [...panel.porMes, { ...panel.totales, periodo: 'TOTAL' }] as unknown as ReportRow[];
        return {
          titulo,
          rows,
          columns: [
            { key: 'periodo', header: 'Período' },
            { key: 'ivaVentas', header: 'IVA Ventas', format: money },
            { key: 'ivaCompras', header: 'IVA Compras', format: money },
            { key: 'debitoFiscal', header: 'Débito Fiscal', format: money },
            { key: 'creditoFiscal', header: 'Crédito Fiscal', format: money },
            { key: 'saldoTecnico', header: 'Saldo Técnico', format: money },
          ],
        };
      }

      case 'tareas': {
        const { data } = await tareasRepository.findManyPaginated(tenantId, FULL_PAGE);
        const rows = data
          .filter((t) => enRango(t.fechaProgramada, query))
          .map((t) => ({
            tipo: t.tipo,
            campo: t.campo.nombre,
            responsable: t.responsable.nombre,
            fechaProgramada: t.fechaProgramada,
            fechaRealizada: t.fechaRealizada,
            estado: t.estado,
            prioridad: t.prioridad,
          }));
        return {
          titulo,
          rows,
          columns: [
            { key: 'tipo', header: 'Tipo' },
            { key: 'campo', header: 'Campo' },
            { key: 'responsable', header: 'Responsable' },
            { key: 'fechaProgramada', header: 'Programada', format: fecha },
            { key: 'fechaRealizada', header: 'Realizada', format: fecha },
            { key: 'estado', header: 'Estado' },
            { key: 'prioridad', header: 'Prioridad' },
          ],
        };
      }

      default: {
        const _exhaustive: never = tipo;
        throw AppError.badRequest(`Tipo de reporte desconocido: ${_exhaustive}`);
      }
    }
  },
};
