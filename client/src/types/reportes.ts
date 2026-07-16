export const TIPOS_REPORTE = [
  'produccion',
  'costos',
  'rentabilidad',
  'cultivos',
  'campos',
  'quimicos',
  'proveedores',
  'clientes',
  'facturacion',
  'iva',
  'caja',
  'tareas',
] as const;

export type TipoReporte = (typeof TIPOS_REPORTE)[number];

export const REPORTE_LABEL: Record<TipoReporte, string> = {
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
  caja: 'Caja',
  tareas: 'Tareas Agrícolas',
};

/** Reportes que requieren desde/hasta obligatoriamente. */
export const REPORTES_CON_RANGO_OBLIGATORIO: TipoReporte[] = ['iva'];

/** Reportes de "datos maestros" sin filtro de fecha aplicable. */
export const REPORTES_SIN_FECHA: TipoReporte[] = ['cultivos', 'campos', 'proveedores', 'clientes'];

export interface ReportColumn {
  key: string;
  header: string;
}

export interface ReporteResult {
  titulo: string;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
}
