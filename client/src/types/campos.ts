export type EstadoCampo = 'ACTIVO' | 'INACTIVO';
export type EstadoSanitario = 'EXCELENTE' | 'BUENO' | 'REGULAR' | 'MALO';

export interface Campo {
  id: string;
  tenantId: string;
  nombre: string;
  ubicacion: string;
  superficieHa: number;
  latitud: number | null;
  longitud: number | null;
  responsableId: string | null;
  responsable?: { id: string; nombre: string } | null;
  estado: EstadoCampo;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
  cultivos?: Cultivo[];
  _count?: { cultivos: number; notas: number; documentos: number; fotos: number; tareas: number };
}

export interface CampoNotaAdjunto {
  id: string;
  url: string;
  nombreArchivo: string;
  mimeType: string;
  createdAt: string;
}

export interface CampoNota {
  id: string;
  campoId: string;
  titulo: string;
  descripcion: string;
  createdAt: string;
  usuario: { id: string; nombre: string };
  adjuntos: CampoNotaAdjunto[];
}

export interface CampoDocumento {
  id: string;
  campoId: string;
  url: string;
  nombre: string;
  mimeType: string;
  createdAt: string;
}

export interface CampoFoto {
  id: string;
  campoId: string;
  url: string;
  descripcion: string | null;
  createdAt: string;
}

export interface Cultivo {
  id: string;
  campoId: string;
  campo?: { id: string; nombre: string };
  nombre: string;
  variedad: string | null;
  fechaPlantacion: string;
  cantidadPlantas: number;
  estadoSanitario: EstadoSanitario;
  produccionEsperadaKg: number | null;
  createdAt: string;
  updatedAt: string;
  historial?: CultivoHistorial[];
}

export interface CultivoHistorial {
  id: string;
  cultivoId: string;
  evento: string;
  detalle: string | null;
  fecha: string;
}
