export interface Cliente {
  id: string;
  razonSocial: string;
  cuit: string;
  contacto: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  saldo: number;
  totalVentas: number;
  createdAt: string;
}

export type TipoMovimientoCCCliente = 'VENTA' | 'COBRO';

export interface MovimientoCCCliente {
  id: string;
  clienteId: string;
  monto: number;
  saldo: number;
  fecha: string;
  descripcion: string | null;
}
