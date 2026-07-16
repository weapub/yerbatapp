import path from 'node:path';
import { config } from 'dotenv';
import {
  PrismaClient,
  RolUsuario,
  EstadoSanitario,
  TipoInsumo,
  TipoTarea,
  EstadoTarea,
  PrioridadTarea,
  TipoCuentaFinanciera,
  TipoMovimientoFinanciero,
  TipoFactura,
  TipoOperacionFactura,
  EstadoFactura,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

const TENANT_NAME = process.env.DEFAULT_TENANT_NAME ?? 'Yerbatera Demo S.A.';
const ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL ?? 'admin@yerbatapp.com';
const ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD ?? 'Admin1234';
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

// IDs deterministas (grupo "0001") para que el seed sea idempotente y no
// choque con los IDs "0000" ya usados por tenant/usuarios/campos/cultivos.
// Arranca en un offset alto para no pisar los IDs fijos (…0101, …0501, etc.)
// usados más abajo para proveedores/productos/tareas/finanzas/clientes.
let seq = 9000;
const nextId = () => {
  seq += 1;
  return `00000000-0000-0000-0001-${seq.toString(16).padStart(12, '0')}`;
};

const hoy = new Date();
const diasDesdeHoy = (dias: number) => {
  const fecha = new Date(hoy);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha;
};

async function main() {
  console.log(`Sembrando datos demo para "${TENANT_NAME}"...`);

  const tenant = await prisma.tenant.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      nombre: TENANT_NAME,
      razonSocial: TENANT_NAME,
      activo: true,
    },
  });

  await prisma.empresaConfig.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      razonSocial: TENANT_NAME,
      cuit: '30-71234567-9',
      direccion: 'Ruta Provincial 103 Km 12, Oberá, Misiones',
      telefono: '+54 3755 421000',
      ivaGeneral: 21,
    },
  });

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      tenantId: tenant.id,
      nombre: 'Administrador',
      email: ADMIN_EMAIL,
      passwordHash,
      rol: RolUsuario.ADMIN,
    },
  });

  const supervisorHash = await bcrypt.hash('Supervisor123!', SALT_ROUNDS);
  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@yerbatapp.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      nombre: 'Supervisor de Campo',
      email: 'supervisor@yerbatapp.com',
      passwordHash: supervisorHash,
      rol: RolUsuario.SUPERVISOR,
    },
  });

  const empleadoHash = await bcrypt.hash('Empleado123!', SALT_ROUNDS);
  const empleado = await prisma.user.upsert({
    where: { email: 'empleado@yerbatapp.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      nombre: 'Juan Pérez',
      email: 'empleado@yerbatapp.com',
      passwordHash: empleadoHash,
      rol: RolUsuario.EMPLEADO,
    },
  });

  // ── Campos / Cultivos ────────────────────────────────────────────────────
  const campoNombres = [
    { nombre: 'Campo 1', ubicacion: 'Oberá, Misiones', superficieHa: 85.5 },
    { nombre: 'Campo 2', ubicacion: 'Apóstoles, Misiones', superficieHa: 62.3 },
    { nombre: 'Campo 3', ubicacion: 'Leandro N. Alem, Misiones', superficieHa: 110.0 },
  ];

  const campos = [];
  const cultivosPorCampo: string[] = [];

  for (const [index, campoData] of campoNombres.entries()) {
    const campo = await prisma.campo.upsert({
      where: { id: `00000000-0000-0000-0000-00000000010${index + 1}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-00000000010${index + 1}`,
        tenantId: tenant.id,
        nombre: campoData.nombre,
        ubicacion: campoData.ubicacion,
        superficieHa: campoData.superficieHa,
        responsableId: index === 0 ? supervisor.id : admin.id,
        observaciones: 'Campo sembrado automáticamente por seed.ts',
      },
    });
    campos.push(campo);

    const cultivo = await prisma.cultivo.upsert({
      where: { id: `00000000-0000-0000-0000-00000000020${index + 1}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-00000000020${index + 1}`,
        campoId: campo.id,
        nombre: 'Yerba Mate',
        variedad: 'Común',
        fechaPlantacion: new Date('2015-06-01'),
        cantidadPlantas: 4000 + index * 500,
        estadoSanitario: EstadoSanitario.BUENO,
        produccionEsperadaKg: 12000 + index * 1000,
      },
    });
    cultivosPorCampo.push(cultivo.id);

    await prisma.campoNota.upsert({
      where: { id: `00000000-0000-0000-0000-00000000030${index + 1}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-00000000030${index + 1}`,
        campoId: campo.id,
        usuarioId: admin.id,
        titulo: 'Alta inicial del campo',
        descripcion: 'Campo cargado en el sistema con datos de referencia.',
      },
    });
  }

  // Segundo cultivo (lote nuevo) en Campo 1, para demostrar multi-cultivo.
  const cultivoNuevoCampo1 = await prisma.cultivo.upsert({
    where: { id: '00000000-0000-0000-0000-000000000204' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000204',
      campoId: campos[0].id,
      nombre: 'Yerba Mate',
      variedad: 'Lote nuevo (replante)',
      fechaPlantacion: new Date('2023-09-15'),
      cantidadPlantas: 1500,
      estadoSanitario: EstadoSanitario.EXCELENTE,
      produccionEsperadaKg: 2000,
    },
  });

  // ── Campaña y Rendimientos ───────────────────────────────────────────────
  const campania = await prisma.campania.upsert({
    where: { id: '00000000-0000-0000-0001-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0001-000000000001',
      tenantId: tenant.id,
      nombre: '2026',
      fechaInicio: new Date('2026-05-01'),
      fechaFin: new Date('2027-04-30'),
    },
  });

  const mesesZafra = [
    { mes: '2026-05-10', factor: 0.9 },
    { mes: '2026-06-10', factor: 1.0 },
    { mes: '2026-07-10', factor: 1.05 },
  ];

  for (const [index, campo] of campos.entries()) {
    const cultivoId = cultivosPorCampo[index];
    const superficieHa = Number(campo.superficieHa);
    for (const punto of mesesZafra) {
      const produccion = Math.round(superficieHa * 180 * punto.factor);
      const rendimientoId = nextId();
      await prisma.rendimiento.upsert({
        where: { id: rendimientoId },
        update: {},
        create: {
          id: rendimientoId,
          campoId: campo.id,
          cultivoId,
          campaniaId: campania.id,
          fecha: new Date(punto.mes),
          produccion,
          rendimientoHa: Math.round((produccion / superficieHa) * 100) / 100,
          costo: Math.round(produccion * 45),
          ingreso: Math.round(produccion * 120),
        },
      });
    }
  }

  // ── Proveedores, Productos y Aplicaciones de insumos ────────────────────
  const proveedoresData = [
    { empresa: 'AgroInsumos del Norte S.A.', cuit: '30-70111222-3', contacto: 'María Gómez', telefono: '+54 3755 400111' },
    { empresa: 'Fertilizantes Misiones S.R.L.', cuit: '30-70222333-4', contacto: 'Carlos Duarte', telefono: '+54 3755 400222' },
    { empresa: 'Herbicidas del Litoral', cuit: '30-70333444-5', contacto: 'Lucía Benítez', telefono: '+54 3755 400333' },
  ];

  const proveedores = [];
  for (const [index, data] of proveedoresData.entries()) {
    const proveedor = await prisma.proveedor.upsert({
      where: { id: `00000000-0000-0000-0001-00000000010${index + 1}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0001-00000000010${index + 1}`,
        tenantId: tenant.id,
        empresa: data.empresa,
        cuit: data.cuit,
        contacto: data.contacto,
        telefono: data.telefono,
        email: data.empresa.toLowerCase().replace(/[^a-z0-9]+/g, '') + '@proveedor-demo.com.ar',
        direccion: 'Parque Industrial, Misiones',
      },
    });
    proveedores.push(proveedor);
  }

  const productosData = [
    { proveedor: proveedores[1], nombre: 'Fertilizante NPK 15-15-15', marca: 'AgroFértil', tipo: TipoInsumo.FERTILIZANTE },
    { proveedor: proveedores[1], nombre: 'Urea Granulada 46%', marca: 'NitroPlus', tipo: TipoInsumo.FERTILIZANTE },
    { proveedor: proveedores[2], nombre: 'Glifosato 48%', marca: 'HerbiMax', tipo: TipoInsumo.HERBICIDA },
    { proveedor: proveedores[2], nombre: 'Herbicida Selectivo Yerba', marca: 'CampoLimpio', tipo: TipoInsumo.HERBICIDA },
  ];

  const productos = [];
  for (const [index, data] of productosData.entries()) {
    const producto = await prisma.producto.upsert({
      where: { id: `00000000-0000-0000-0001-00000000020${index + 1}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0001-00000000020${index + 1}`,
        proveedorId: data.proveedor.id,
        nombre: data.nombre,
        marca: data.marca,
        tipo: data.tipo,
      },
    });
    productos.push(producto);
  }

  const aplicacionesData = [
    { campoIdx: 0, producto: productos[0], fecha: '2026-05-20', dosis: 250, cantidad: 21.4, costo: 320000, aplicador: empleado },
    { campoIdx: 0, producto: productos[2], fecha: '2026-06-05', dosis: 3, cantidad: 0.26, costo: 45000, aplicador: empleado },
    { campoIdx: 1, producto: productos[1], fecha: '2026-06-15', dosis: 200, cantidad: 12.5, costo: 210000, aplicador: supervisor },
    { campoIdx: 2, producto: productos[3], fecha: '2026-06-25', dosis: 4, cantidad: 4.4, costo: 98000, aplicador: supervisor },
    { campoIdx: 2, producto: productos[0], fecha: '2026-07-05', dosis: 250, cantidad: 27.5, costo: 410000, aplicador: empleado },
  ];

  for (const [index, data] of aplicacionesData.entries()) {
    const campo = campos[data.campoIdx];
    await prisma.aplicacionInsumo.upsert({
      where: { id: `00000000-0000-0000-0001-00000000030${index + 1}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0001-00000000030${index + 1}`,
        tipo: data.producto.tipo,
        campoId: campo.id,
        cultivoId: cultivosPorCampo[data.campoIdx],
        productoId: data.producto.id,
        proveedorId: data.producto.proveedorId,
        fecha: new Date(data.fecha),
        dosisHa: data.dosis,
        cantidadUtilizada: data.cantidad,
        costo: data.costo,
        aplicadorId: data.aplicador.id,
        observaciones: 'Aplicación registrada por seed.ts',
      },
    });
  }

  // ── Tareas Agrícolas (una de cada color de semáforo) ────────────────────
  const tareasData = [
    {
      tipo: TipoTarea.COSECHA,
      campoIdx: 0,
      responsable: supervisor,
      fechaProgramada: diasDesdeHoy(-10),
      estado: EstadoTarea.COMPLETADA,
      fechaRealizada: diasDesdeHoy(-9),
      prioridad: PrioridadTarea.ALTA,
      observaciones: 'Cosecha de invierno finalizada sin novedades.',
    },
    {
      tipo: TipoTarea.DESMALEZADO,
      campoIdx: 1,
      responsable: empleado,
      fechaProgramada: diasDesdeHoy(-5),
      estado: EstadoTarea.COMPLETADA,
      fechaRealizada: diasDesdeHoy(-5),
      prioridad: PrioridadTarea.MEDIA,
      observaciones: null,
    },
    {
      // Vencida (prioridad media, pero con fecha ya pasada) → semáforo ROJO
      tipo: TipoTarea.CONTROL_SANITARIO,
      campoIdx: 0,
      responsable: empleado,
      fechaProgramada: diasDesdeHoy(-3),
      estado: EstadoTarea.PENDIENTE,
      fechaRealizada: null,
      prioridad: PrioridadTarea.MEDIA,
      observaciones: 'Revisar hojas con manchas reportadas por el encargado.',
    },
    {
      // Prioridad alta → semáforo ROJO aunque no esté vencida todavía
      tipo: TipoTarea.APLICACION_FERTILIZANTE,
      campoIdx: 2,
      responsable: supervisor,
      fechaProgramada: diasDesdeHoy(15),
      estado: EstadoTarea.PENDIENTE,
      fechaRealizada: null,
      prioridad: PrioridadTarea.ALTA,
      observaciones: 'Fertilización previa a la próxima zafra.',
    },
    {
      // Dentro de la ventana de 3 días → semáforo AMARILLO
      tipo: TipoTarea.PODA,
      campoIdx: 1,
      responsable: empleado,
      fechaProgramada: diasDesdeHoy(2),
      estado: EstadoTarea.PENDIENTE,
      fechaRealizada: null,
      prioridad: PrioridadTarea.MEDIA,
      observaciones: null,
    },
    {
      // En progreso, vence hoy → también AMARILLO
      tipo: TipoTarea.CONTROL_PLAGAS,
      campoIdx: 0,
      responsable: supervisor,
      fechaProgramada: diasDesdeHoy(0),
      estado: EstadoTarea.EN_PROGRESO,
      fechaRealizada: null,
      prioridad: PrioridadTarea.MEDIA,
      observaciones: 'Monitoreo de pulgones en lote nuevo.',
    },
    {
      // Lejos en el tiempo, prioridad baja → semáforo VERDE
      tipo: TipoTarea.MANTENIMIENTO,
      campoIdx: 2,
      responsable: admin,
      fechaProgramada: diasDesdeHoy(30),
      estado: EstadoTarea.PENDIENTE,
      fechaRealizada: null,
      prioridad: PrioridadTarea.BAJA,
      observaciones: 'Mantenimiento de caminos internos.',
    },
  ];

  for (const [index, data] of tareasData.entries()) {
    await prisma.tarea.upsert({
      where: { id: `00000000-0000-0000-0001-00000000040${index + 1}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0001-00000000040${index + 1}`,
        tenantId: tenant.id,
        tipo: data.tipo,
        campoId: campos[data.campoIdx].id,
        cultivoId: cultivosPorCampo[data.campoIdx],
        responsableId: data.responsable.id,
        fechaProgramada: data.fechaProgramada,
        fechaRealizada: data.fechaRealizada,
        estado: data.estado,
        prioridad: data.prioridad,
        observaciones: data.observaciones,
      },
    });
  }

  // ── Finanzas: cuentas, categorías, centros de costo ─────────────────────
  const cajaCentral = await prisma.cuentaFinanciera.upsert({
    where: { id: '00000000-0000-0000-0001-000000000501' },
    update: {},
    create: {
      id: '00000000-0000-0000-0001-000000000501',
      tenantId: tenant.id,
      nombre: 'Caja Central',
      tipo: TipoCuentaFinanciera.CAJA,
      saldoInicial: 500000,
    },
  });

  const bancoGalicia = await prisma.cuentaFinanciera.upsert({
    where: { id: '00000000-0000-0000-0001-000000000502' },
    update: {},
    create: {
      id: '00000000-0000-0000-0001-000000000502',
      tenantId: tenant.id,
      nombre: 'Banco Galicia Cta Cte',
      tipo: TipoCuentaFinanciera.BANCO,
      saldoInicial: 1200000,
    },
  });

  const categoriasData = [
    { nombre: 'Venta de Yerba Mate', tipo: TipoMovimientoFinanciero.INGRESO },
    { nombre: 'Otros Ingresos', tipo: TipoMovimientoFinanciero.INGRESO },
    { nombre: 'Insumos Agrícolas', tipo: TipoMovimientoFinanciero.EGRESO },
    { nombre: 'Mano de Obra', tipo: TipoMovimientoFinanciero.EGRESO },
    { nombre: 'Servicios y Mantenimiento', tipo: TipoMovimientoFinanciero.EGRESO },
    { nombre: 'Impuestos', tipo: TipoMovimientoFinanciero.EGRESO },
  ];
  const categorias = [];
  for (const [index, data] of categoriasData.entries()) {
    const categoria = await prisma.categoriaFinanciera.upsert({
      where: { id: `00000000-0000-0000-0001-00000000060${index + 1}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0001-00000000060${index + 1}`,
        tenantId: tenant.id,
        nombre: data.nombre,
        tipo: data.tipo,
      },
    });
    categorias.push(categoria);
  }

  const centrosData = ['Campo 1', 'Campo 2', 'Campo 3', 'Administración'];
  const centros = [];
  for (const [index, nombre] of centrosData.entries()) {
    const centro = await prisma.centroCosto.upsert({
      where: { id: `00000000-0000-0000-0001-00000000070${index + 1}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0001-00000000070${index + 1}`,
        tenantId: tenant.id,
        nombre,
      },
    });
    centros.push(centro);
  }

  // ── Clientes ──────────────────────────────────────────────────────────
  const clientesData = [
    { razonSocial: 'Molinos Misioneros S.A.', cuit: '30-65111222-1', contacto: 'Ana Silva', telefono: '+54 3752 411000' },
    { razonSocial: 'Distribuidora del Litoral S.R.L.', cuit: '30-65222333-2', contacto: 'Roberto Kaiser', telefono: '+54 3752 411500' },
    { razonSocial: 'Almacén Don Ceferino', cuit: '27-30111222-6', contacto: 'Ceferino López', telefono: '+54 3755 401200' },
  ];
  const clientes = [];
  for (const [index, data] of clientesData.entries()) {
    const cliente = await prisma.cliente.upsert({
      where: { id: `00000000-0000-0000-0001-00000000080${index + 1}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0001-00000000080${index + 1}`,
        tenantId: tenant.id,
        razonSocial: data.razonSocial,
        cuit: data.cuit,
        contacto: data.contacto,
        telefono: data.telefono,
        email: data.razonSocial.toLowerCase().replace(/[^a-z0-9]+/g, '') + '@cliente-demo.com.ar',
        direccion: 'Misiones, Argentina',
      },
    });
    clientes.push(cliente);
  }

  // ── Facturas + Cuenta Corriente (réplica del ledger de facturas.service) ─
  const saldoClienteAcumulado: Record<string, number> = {};
  const saldoProveedorAcumulado: Record<string, number> = {};

  const registrarMovimientoCliente = async (
    id: string,
    clienteId: string,
    facturaId: string,
    monto: number,
    fecha: Date,
    descripcion: string,
  ) => {
    const saldoAnterior = saldoClienteAcumulado[clienteId] ?? 0;
    const saldo = saldoAnterior + monto;
    saldoClienteAcumulado[clienteId] = saldo;
    await prisma.movimientoCuentaCorriente.upsert({
      where: { id },
      update: {},
      create: { id, clienteId, facturaId, monto, saldo, fecha, descripcion },
    });
  };

  const registrarMovimientoProveedor = async (
    id: string,
    proveedorId: string,
    facturaId: string | null,
    monto: number,
    fecha: Date,
    descripcion: string,
  ) => {
    const saldoAnterior = saldoProveedorAcumulado[proveedorId] ?? 0;
    const saldo = saldoAnterior + monto;
    saldoProveedorAcumulado[proveedorId] = saldo;
    await prisma.movimientoCuentaCorriente.upsert({
      where: { id },
      update: {},
      create: { id, proveedorId, facturaId, monto, saldo, fecha, descripcion },
    });
  };

  const crearFacturaVenta = async (
    idSuffix: string,
    numero: string,
    cliente: (typeof clientes)[number],
    fecha: string,
    importeNeto: number,
    estado: EstadoFactura,
  ) => {
    const iva = Math.round(importeNeto * 0.21);
    const total = importeNeto + iva;
    const factura = await prisma.factura.upsert({
      where: { id: `00000000-0000-0000-0001-00000000090${idSuffix}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0001-00000000090${idSuffix}`,
        tenantId: tenant.id,
        tipo: TipoFactura.A,
        operacion: TipoOperacionFactura.VENTA,
        numero,
        clienteId: cliente.id,
        fecha: new Date(fecha),
        importeNeto,
        iva,
        total,
        estado,
      },
    });
    await registrarMovimientoCliente(
      `00000000-0000-0000-0001-00000000100${idSuffix}`,
      cliente.id,
      factura.id,
      total,
      new Date(fecha),
      `Factura ${factura.tipo}-${factura.numero}`,
    );
    return factura;
  };

  const facturaVenta1 = await crearFacturaVenta('1', '0001-00001234', clientes[0], '2026-06-10', 850000, EstadoFactura.PAGADA);
  await crearFacturaVenta('2', '0001-00001256', clientes[0], '2026-07-08', 620000, EstadoFactura.PENDIENTE);
  await crearFacturaVenta('3', '0001-00001301', clientes[1], '2026-05-20', 430000, EstadoFactura.VENCIDA);
  await crearFacturaVenta('4', '0001-00001098', clientes[2], '2026-06-25', 180000, EstadoFactura.PAGADA);

  // Cobro parcial de Molinos Misioneros contra la primera factura (COBRO → monto negativo).
  await registrarMovimientoCliente(
    '00000000-0000-0000-0001-000000001005',
    clientes[0].id,
    facturaVenta1.id,
    -Number(facturaVenta1.total),
    new Date('2026-06-20'),
    'Cobro por transferencia — Factura A-0001-00001234',
  );

  // Compra a proveedor (genera cuenta corriente del lado proveedor).
  const facturaCompra = await prisma.factura.upsert({
    where: { id: '00000000-0000-0000-0001-000000000991' },
    update: {},
    create: {
      id: '00000000-0000-0000-0001-000000000991',
      tenantId: tenant.id,
      tipo: TipoFactura.A,
      operacion: TipoOperacionFactura.COMPRA,
      numero: '0003-00005567',
      proveedorId: proveedores[1].id,
      fecha: new Date('2026-06-15'),
      importeNeto: 210000,
      iva: 44100,
      total: 254100,
      estado: EstadoFactura.PAGADA,
    },
  });
  await registrarMovimientoProveedor(
    '00000000-0000-0000-0001-000000001101',
    proveedores[1].id,
    facturaCompra.id,
    254100,
    new Date('2026-06-15'),
    `Factura ${facturaCompra.tipo}-${facturaCompra.numero}`,
  );

  // ── Movimientos financieros (caja/banco) ────────────────────────────────
  const movimientosData = [
    {
      cuenta: bancoGalicia,
      categoria: categorias[0],
      centro: centros[3],
      tipo: TipoMovimientoFinanciero.INGRESO,
      monto: 850000,
      fecha: '2026-06-20',
      descripcion: 'Cobro Factura A-0001-00001234 — Molinos Misioneros',
      facturaId: facturaVenta1.id,
    },
    {
      cuenta: bancoGalicia,
      categoria: categorias[0],
      centro: centros[3],
      tipo: TipoMovimientoFinanciero.INGRESO,
      monto: 217800,
      fecha: '2026-06-28',
      descripcion: 'Cobro Factura A-0001-00001098 — Almacén Don Ceferino',
      facturaId: null,
    },
    {
      cuenta: bancoGalicia,
      categoria: categorias[2],
      centro: centros[1],
      tipo: TipoMovimientoFinanciero.EGRESO,
      monto: 254100,
      fecha: '2026-06-15',
      descripcion: 'Pago Factura A-0003-00005567 — Fertilizantes Misiones',
      facturaId: null,
    },
    {
      cuenta: cajaCentral,
      categoria: categorias[3],
      centro: centros[0],
      tipo: TipoMovimientoFinanciero.EGRESO,
      monto: 620000,
      fecha: '2026-06-30',
      descripcion: 'Sueldos cuadrilla de cosecha — junio',
      facturaId: null,
    },
    {
      cuenta: cajaCentral,
      categoria: categorias[4],
      centro: centros[3],
      tipo: TipoMovimientoFinanciero.EGRESO,
      monto: 95000,
      fecha: '2026-06-05',
      descripcion: 'Reparación de tractor',
      facturaId: null,
    },
    {
      cuenta: bancoGalicia,
      categoria: categorias[5],
      centro: centros[3],
      tipo: TipoMovimientoFinanciero.EGRESO,
      monto: 145000,
      fecha: '2026-06-10',
      descripcion: 'Ingresos Brutos — anticipo junio',
      facturaId: null,
    },
    {
      cuenta: cajaCentral,
      categoria: categorias[1],
      centro: centros[3],
      tipo: TipoMovimientoFinanciero.INGRESO,
      monto: 60000,
      fecha: '2026-07-02',
      descripcion: 'Venta de excedente de plantines',
      facturaId: null,
    },
  ];

  for (const [index, data] of movimientosData.entries()) {
    await prisma.movimientoFinanciero.upsert({
      where: { id: `00000000-0000-0000-0001-00000000120${index + 1}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0001-00000000120${index + 1}`,
        cuentaId: data.cuenta.id,
        categoriaId: data.categoria.id,
        centroCostoId: data.centro.id,
        tipo: data.tipo,
        monto: data.monto,
        fecha: new Date(data.fecha),
        descripcion: data.descripcion,
        facturaId: data.facturaId,
      },
    });
  }

  console.log('Datos demo sembrados: campos, cultivos, campaña, rendimientos,');
  console.log('proveedores, productos, aplicaciones, tareas, finanzas, clientes y facturas.');
  console.log(`Cultivo lote nuevo Campo 1: ${cultivoNuevoCampo1.nombre} (${cultivoNuevoCampo1.variedad})`);
  console.log('Seed completado.');
  console.log(`Login admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log('Login supervisor: supervisor@yerbatapp.com / Supervisor123!');
  console.log('Login empleado: empleado@yerbatapp.com / Empleado123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
