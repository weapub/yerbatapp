export interface EmpresaConfig {
  id: string;
  tenantId: string;
  razonSocial: string;
  cuit: string | null;
  logoUrl: string | null;
  direccion: string | null;
  telefono: string | null;
  ivaGeneral: number;
}

export interface ParametroSistema {
  id: string;
  clave: string;
  valor: string;
}

export type TipoBackup = 'AUTOMATICO' | 'MANUAL';
export type EstadoBackup = 'EN_PROGRESO' | 'COMPLETADO' | 'FALLIDO';

export interface BackupLog {
  id: string;
  tipo: TipoBackup;
  estado: EstadoBackup;
  archivoUrl: string | null;
  tamanioBytes: string | null;
  iniciadoEn: string;
  finalizadoEn: string | null;
}
