export type UnidadProduccion = 'KG' | 'TONELADA';

export interface Campania {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  _count?: { rendimientos: number };
}

export interface Rendimiento {
  id: string;
  campoId: string;
  campo: { nombre: string; superficieHa: number | string };
  cultivoId: string;
  cultivo: { nombre: string };
  campaniaId: string;
  campania: { nombre: string };
  fecha: string;
  produccion: number;
  unidad: UnidadProduccion;
  rendimientoHa: number;
  costo: number;
  ingreso: number;
  rentabilidad: number;
  rentabilidadPorcentaje: number | null;
  createdAt: string;
}

export type ComparativaGroupBy = 'campo' | 'cultivo' | 'campania';

export interface ComparativaRow {
  key: string;
  label: string;
  totalProduccion: number;
  totalCosto: number;
  totalIngreso: number;
  rentabilidad: number;
  rendimientoPromedioHa: number;
}
