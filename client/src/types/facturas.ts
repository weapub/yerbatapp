export type TipoFactura = 'A' | 'B' | 'C';
export type TipoOperacionFactura = 'VENTA' | 'COMPRA';
export type EstadoFactura = 'PENDIENTE' | 'PAGADA' | 'VENCIDA' | 'ANULADA';

export interface FacturaAdjunto {
  id: string;
  url: string;
  nombreArchivo: string;
  createdAt: string;
}

export interface Factura {
  id: string;
  tipo: TipoFactura;
  operacion: TipoOperacionFactura;
  numero: string;
  clienteId: string | null;
  cliente: { id: string; razonSocial: string } | null;
  proveedorId: string | null;
  proveedor: { id: string; empresa: string } | null;
  fecha: string;
  cae: string | null;
  importeNeto: number;
  iva: number;
  total: number;
  estado: EstadoFactura;
  adjuntos: FacturaAdjunto[];
  createdAt: string;
}

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
