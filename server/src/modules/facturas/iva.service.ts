import { facturasRepository } from './facturas.repository';
import { PanelIvaQuery } from './facturas.validation';

export interface IvaPeriodo {
  periodo: string;
  ivaVentas: number;
  ivaCompras: number;
  debitoFiscal: number;
  creditoFiscal: number;
  saldoTecnico: number;
}

export interface PanelIva {
  porMes: IvaPeriodo[];
  totales: IvaPeriodo;
}

// Mismo criterio que en finanzas/reportes.service.ts: agrupar con getters UTC para
// no correr el mes por el offset horario del servidor (America/Buenos_Aires, UTC-3).
const periodoKey = (fecha: Date) => `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`;

export const ivaService = {
  async panel(tenantId: string, query: PanelIvaQuery): Promise<PanelIva> {
    const facturas = await facturasRepository.findManyForIva(tenantId, query.desde, query.hasta);

    const porMesMap = new Map<string, { ivaVentas: number; ivaCompras: number }>();

    for (const f of facturas) {
      const key = periodoKey(f.fecha);
      const entry = porMesMap.get(key) ?? { ivaVentas: 0, ivaCompras: 0 };
      const iva = Number(f.iva);
      if (f.operacion === 'VENTA') entry.ivaVentas += iva;
      else entry.ivaCompras += iva;
      porMesMap.set(key, entry);
    }

    const porMes: IvaPeriodo[] = Array.from(porMesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([periodo, { ivaVentas, ivaCompras }]) => buildPeriodo(periodo, ivaVentas, ivaCompras));

    const totalVentas = porMes.reduce((acc, p) => acc + p.ivaVentas, 0);
    const totalCompras = porMes.reduce((acc, p) => acc + p.ivaCompras, 0);

    return { porMes, totales: buildPeriodo('total', totalVentas, totalCompras) };
  },

  async facturasParaExport(tenantId: string, query: PanelIvaQuery) {
    return facturasRepository.findManyForIva(tenantId, query.desde, query.hasta);
  },
};

const buildPeriodo = (periodo: string, ivaVentas: number, ivaCompras: number): IvaPeriodo => ({
  periodo,
  ivaVentas: Number(ivaVentas.toFixed(2)),
  ivaCompras: Number(ivaCompras.toFixed(2)),
  // Débito Fiscal = IVA cobrado en ventas; Crédito Fiscal = IVA pagado en compras (deducible).
  debitoFiscal: Number(ivaVentas.toFixed(2)),
  creditoFiscal: Number(ivaCompras.toFixed(2)),
  // Saldo técnico positivo = a pagar a AFIP; negativo = saldo a favor.
  saldoTecnico: Number((ivaVentas - ivaCompras).toFixed(2)),
});
