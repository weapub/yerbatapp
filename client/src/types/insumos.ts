export type TipoInsumo = 'FERTILIZANTE' | 'HERBICIDA';

export interface Producto {
  id: string;
  proveedorId: string;
  nombre: string;
  marca: string | null;
  tipo: TipoInsumo;
}

export interface Proveedor {
  id: string;
  empresa: string;
  cuit: string;
  contacto: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  saldo: number;
  totalCompras: number;
  productos?: Producto[];
  _count?: { productos: number; aplicaciones: number };
}

export type TipoMovimientoCCProveedor = 'COMPRA' | 'PAGO';

export interface MovimientoCCProveedor {
  id: string;
  proveedorId: string;
  monto: number;
  saldo: number;
  fecha: string;
  descripcion: string | null;
}

export interface HistorialAplicacion {
  id: string;
  fecha: string;
  tipo: TipoInsumo;
  campo: string;
  cultivo: string;
  producto: string;
  marca: string | null;
  cantidadUtilizada: number;
  costo: number;
}

export interface AplicacionInsumo {
  id: string;
  tipo: TipoInsumo;
  campoId: string;
  campo: { nombre: string };
  cultivoId: string;
  cultivo: { nombre: string };
  productoId: string;
  producto: { nombre: string; marca: string | null };
  proveedorId: string;
  proveedor: { empresa: string };
  aplicadorId: string;
  aplicador: { nombre: string };
  fecha: string;
  dosisHa: number;
  cantidadUtilizada: number;
  costo: number;
  costoPorHa: number | null;
  observaciones: string | null;
  createdAt: string;
}

export interface EstadisticasInsumo {
  promedioDosisHa: number;
  costoTotal: number;
  costoPromedioHa: number;
  porCultivo: { cultivoId: string; nombre: string; promedioDosisHa: number; costoTotal: number }[];
  porAnio: { anio: number; promedioDosisHa: number; costoTotal: number }[];
}
