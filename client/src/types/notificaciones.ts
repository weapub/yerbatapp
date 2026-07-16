export type TipoNotificacion =
  | 'VENCIMIENTO_FACTURA'
  | 'VENCIMIENTO_TAREA'
  | 'APLICACION_AGRICOLA'
  | 'STOCK_BAJO'
  | 'SISTEMA';

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  mensaje: string;
  leida: boolean;
  entidadTipo: string | null;
  entidadId: string | null;
  createdAt: string;
}
