export type TipoCuentaFinanciera = 'CAJA' | 'BANCO';
export type TipoMovimientoFinanciero = 'INGRESO' | 'EGRESO';

export interface CuentaFinanciera {
  id: string;
  nombre: string;
  tipo: TipoCuentaFinanciera;
  saldoInicial: number;
  saldoActual: number;
  createdAt: string;
}

export interface CategoriaFinanciera {
  id: string;
  nombre: string;
  tipo: TipoMovimientoFinanciero;
}

export interface CentroCosto {
  id: string;
  nombre: string;
}

export interface MovimientoAdjunto {
  id: string;
  url: string;
  nombreArchivo: string;
  createdAt: string;
}

export interface MovimientoFinanciero {
  id: string;
  cuentaId: string;
  cuenta: { id: string; nombre: string };
  categoriaId: string;
  categoria: { id: string; nombre: string };
  centroCostoId: string | null;
  centroCosto: { id: string; nombre: string } | null;
  tipo: TipoMovimientoFinanciero;
  monto: number;
  fecha: string;
  descripcion: string | null;
  adjuntos: MovimientoAdjunto[];
  createdAt: string;
}

export interface Balance {
  ingresos: number;
  egresos: number;
  rentabilidad: number;
  porCategoria: { categoriaId: string; nombre: string; tipo: TipoMovimientoFinanciero; total: number }[];
}

export interface FlujoCajaPunto {
  periodo: string;
  ingresos: number;
  egresos: number;
  saldoAcumulado: number;
}
