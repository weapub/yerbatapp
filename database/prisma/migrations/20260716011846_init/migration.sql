-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'SUPERVISOR', 'EMPLEADO');

-- CreateEnum
CREATE TYPE "EstadoCampo" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "EstadoSanitario" AS ENUM ('EXCELENTE', 'BUENO', 'REGULAR', 'MALO');

-- CreateEnum
CREATE TYPE "TipoInsumo" AS ENUM ('FERTILIZANTE', 'HERBICIDA');

-- CreateEnum
CREATE TYPE "UnidadProduccion" AS ENUM ('KG', 'TONELADA');

-- CreateEnum
CREATE TYPE "TipoTarea" AS ENUM ('DESMALEZADO', 'APLICACION_HERBICIDA', 'APLICACION_FERTILIZANTE', 'PODA', 'CONTROL_PLAGAS', 'LIMPIEZA', 'COSECHA', 'MANTENIMIENTO', 'REPARACIONES', 'RIEGO', 'FERTILIZACION', 'CONTROL_SANITARIO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoTarea" AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "PrioridadTarea" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "TipoCuentaFinanciera" AS ENUM ('CAJA', 'BANCO');

-- CreateEnum
CREATE TYPE "TipoMovimientoFinanciero" AS ENUM ('INGRESO', 'EGRESO');

-- CreateEnum
CREATE TYPE "TipoFactura" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "TipoOperacionFactura" AS ENUM ('VENTA', 'COMPRA');

-- CreateEnum
CREATE TYPE "EstadoFactura" AS ENUM ('PENDIENTE', 'PAGADA', 'VENCIDA', 'ANULADA');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('VENCIMIENTO_FACTURA', 'VENCIMIENTO_TAREA', 'APLICACION_AGRICOLA', 'STOCK_BAJO', 'SISTEMA');

-- CreateEnum
CREATE TYPE "TipoBackup" AS ENUM ('AUTOMATICO', 'MANUAL');

-- CreateEnum
CREATE TYPE "EstadoBackup" AS ENUM ('EN_PROGRESO', 'COMPLETADO', 'FALLIDO');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "razonSocial" TEXT,
    "cuit" TEXT,
    "logoUrl" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'EMPLEADO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcceso" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "exitoso" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "cambios" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campo" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "superficieHa" DECIMAL(10,2) NOT NULL,
    "latitud" DECIMAL(9,6),
    "longitud" DECIMAL(9,6),
    "responsableId" TEXT,
    "estado" "EstadoCampo" NOT NULL DEFAULT 'ACTIVO',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampoNota" (
    "id" TEXT NOT NULL,
    "campoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampoNota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampoNotaAdjunto" (
    "id" TEXT NOT NULL,
    "notaId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampoNotaAdjunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampoDocumento" (
    "id" TEXT NOT NULL,
    "campoId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampoDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampoFoto" (
    "id" TEXT NOT NULL,
    "campoId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampoFoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cultivo" (
    "id" TEXT NOT NULL,
    "campoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "variedad" TEXT,
    "fechaPlantacion" TIMESTAMP(3) NOT NULL,
    "cantidadPlantas" INTEGER NOT NULL,
    "estadoSanitario" "EstadoSanitario" NOT NULL DEFAULT 'BUENO',
    "produccionEsperadaKg" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cultivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CultivoHistorial" (
    "id" TEXT NOT NULL,
    "cultivoId" TEXT NOT NULL,
    "evento" TEXT NOT NULL,
    "detalle" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CultivoHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campania" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campania_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rendimiento" (
    "id" TEXT NOT NULL,
    "campoId" TEXT NOT NULL,
    "cultivoId" TEXT NOT NULL,
    "campaniaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "produccion" DECIMAL(12,2) NOT NULL,
    "unidad" "UnidadProduccion" NOT NULL DEFAULT 'KG',
    "rendimientoHa" DECIMAL(12,2) NOT NULL,
    "costo" DECIMAL(12,2) NOT NULL,
    "ingreso" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rendimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "marca" TEXT,
    "tipo" "TipoInsumo" NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AplicacionInsumo" (
    "id" TEXT NOT NULL,
    "tipo" "TipoInsumo" NOT NULL,
    "campoId" TEXT NOT NULL,
    "cultivoId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "dosisHa" DECIMAL(10,2) NOT NULL,
    "cantidadUtilizada" DECIMAL(10,2) NOT NULL,
    "costo" DECIMAL(12,2) NOT NULL,
    "aplicadorId" TEXT NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AplicacionInsumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarea" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipo" "TipoTarea" NOT NULL,
    "campoId" TEXT NOT NULL,
    "cultivoId" TEXT,
    "responsableId" TEXT NOT NULL,
    "fechaProgramada" TIMESTAMP(3) NOT NULL,
    "fechaRealizada" TIMESTAMP(3),
    "estado" "EstadoTarea" NOT NULL DEFAULT 'PENDIENTE',
    "prioridad" "PrioridadTarea" NOT NULL DEFAULT 'MEDIA',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TareaAdjunto" (
    "id" TEXT NOT NULL,
    "tareaId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TareaAdjunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuentaFinanciera" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoCuentaFinanciera" NOT NULL,
    "saldoInicial" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CuentaFinanciera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaFinanciera" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoMovimientoFinanciero" NOT NULL,

    CONSTRAINT "CategoriaFinanciera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CentroCosto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "CentroCosto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoFinanciero" (
    "id" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "centroCostoId" TEXT,
    "tipo" "TipoMovimientoFinanciero" NOT NULL,
    "monto" DECIMAL(14,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT,
    "facturaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoFinanciero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoAdjunto" (
    "id" TEXT NOT NULL,
    "movimientoId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoAdjunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "contacto" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoCuentaCorriente" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT,
    "proveedorId" TEXT,
    "facturaId" TEXT,
    "monto" DECIMAL(14,2) NOT NULL,
    "saldo" DECIMAL(14,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT,

    CONSTRAINT "MovimientoCuentaCorriente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Factura" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipo" "TipoFactura" NOT NULL,
    "operacion" "TipoOperacionFactura" NOT NULL,
    "numero" TEXT NOT NULL,
    "clienteId" TEXT,
    "proveedorId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "cae" TEXT,
    "importeNeto" DECIMAL(14,2) NOT NULL,
    "iva" DECIMAL(14,2) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,
    "estado" "EstadoFactura" NOT NULL DEFAULT 'PENDIENTE',
    "archivoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturaAdjunto" (
    "id" TEXT NOT NULL,
    "facturaId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacturaAdjunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "entidadTipo" TEXT,
    "entidadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipo" "TipoBackup" NOT NULL,
    "estado" "EstadoBackup" NOT NULL,
    "archivoUrl" TEXT,
    "tamanioBytes" BIGINT,
    "iniciadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadoEn" TIMESTAMP(3),

    CONSTRAINT "BackupLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmpresaConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "cuit" TEXT,
    "logoUrl" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "ivaGeneral" DECIMAL(5,2) NOT NULL DEFAULT 21,

    CONSTRAINT "EmpresaConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParametroSistema" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "ParametroSistema_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "LoginHistory_userId_idx" ON "LoginHistory"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_entidad_entidadId_idx" ON "ActivityLog"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "Campo_tenantId_idx" ON "Campo"("tenantId");

-- CreateIndex
CREATE INDEX "CampoNota_campoId_idx" ON "CampoNota"("campoId");

-- CreateIndex
CREATE INDEX "CampoNotaAdjunto_notaId_idx" ON "CampoNotaAdjunto"("notaId");

-- CreateIndex
CREATE INDEX "CampoDocumento_campoId_idx" ON "CampoDocumento"("campoId");

-- CreateIndex
CREATE INDEX "CampoFoto_campoId_idx" ON "CampoFoto"("campoId");

-- CreateIndex
CREATE INDEX "Cultivo_campoId_idx" ON "Cultivo"("campoId");

-- CreateIndex
CREATE INDEX "CultivoHistorial_cultivoId_idx" ON "CultivoHistorial"("cultivoId");

-- CreateIndex
CREATE INDEX "Rendimiento_campoId_idx" ON "Rendimiento"("campoId");

-- CreateIndex
CREATE INDEX "Rendimiento_cultivoId_idx" ON "Rendimiento"("cultivoId");

-- CreateIndex
CREATE INDEX "Rendimiento_campaniaId_idx" ON "Rendimiento"("campaniaId");

-- CreateIndex
CREATE INDEX "Proveedor_tenantId_idx" ON "Proveedor"("tenantId");

-- CreateIndex
CREATE INDEX "Producto_proveedorId_idx" ON "Producto"("proveedorId");

-- CreateIndex
CREATE INDEX "AplicacionInsumo_campoId_idx" ON "AplicacionInsumo"("campoId");

-- CreateIndex
CREATE INDEX "AplicacionInsumo_cultivoId_idx" ON "AplicacionInsumo"("cultivoId");

-- CreateIndex
CREATE INDEX "AplicacionInsumo_tipo_idx" ON "AplicacionInsumo"("tipo");

-- CreateIndex
CREATE INDEX "Tarea_tenantId_idx" ON "Tarea"("tenantId");

-- CreateIndex
CREATE INDEX "Tarea_campoId_idx" ON "Tarea"("campoId");

-- CreateIndex
CREATE INDEX "Tarea_estado_idx" ON "Tarea"("estado");

-- CreateIndex
CREATE INDEX "Tarea_fechaProgramada_idx" ON "Tarea"("fechaProgramada");

-- CreateIndex
CREATE INDEX "TareaAdjunto_tareaId_idx" ON "TareaAdjunto"("tareaId");

-- CreateIndex
CREATE INDEX "CuentaFinanciera_tenantId_idx" ON "CuentaFinanciera"("tenantId");

-- CreateIndex
CREATE INDEX "MovimientoFinanciero_cuentaId_idx" ON "MovimientoFinanciero"("cuentaId");

-- CreateIndex
CREATE INDEX "MovimientoFinanciero_fecha_idx" ON "MovimientoFinanciero"("fecha");

-- CreateIndex
CREATE INDEX "MovimientoAdjunto_movimientoId_idx" ON "MovimientoAdjunto"("movimientoId");

-- CreateIndex
CREATE INDEX "Cliente_tenantId_idx" ON "Cliente"("tenantId");

-- CreateIndex
CREATE INDEX "MovimientoCuentaCorriente_clienteId_idx" ON "MovimientoCuentaCorriente"("clienteId");

-- CreateIndex
CREATE INDEX "MovimientoCuentaCorriente_proveedorId_idx" ON "MovimientoCuentaCorriente"("proveedorId");

-- CreateIndex
CREATE INDEX "Factura_tenantId_idx" ON "Factura"("tenantId");

-- CreateIndex
CREATE INDEX "Factura_operacion_idx" ON "Factura"("operacion");

-- CreateIndex
CREATE INDEX "Factura_estado_idx" ON "Factura"("estado");

-- CreateIndex
CREATE INDEX "Factura_fecha_idx" ON "Factura"("fecha");

-- CreateIndex
CREATE INDEX "FacturaAdjunto_facturaId_idx" ON "FacturaAdjunto"("facturaId");

-- CreateIndex
CREATE INDEX "Notificacion_userId_leida_idx" ON "Notificacion"("userId", "leida");

-- CreateIndex
CREATE INDEX "Notificacion_tenantId_idx" ON "Notificacion"("tenantId");

-- CreateIndex
CREATE INDEX "BackupLog_tenantId_idx" ON "BackupLog"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "EmpresaConfig_tenantId_key" ON "EmpresaConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ParametroSistema_clave_key" ON "ParametroSistema"("clave");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campo" ADD CONSTRAINT "Campo_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campo" ADD CONSTRAINT "Campo_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampoNota" ADD CONSTRAINT "CampoNota_campoId_fkey" FOREIGN KEY ("campoId") REFERENCES "Campo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampoNota" ADD CONSTRAINT "CampoNota_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampoNotaAdjunto" ADD CONSTRAINT "CampoNotaAdjunto_notaId_fkey" FOREIGN KEY ("notaId") REFERENCES "CampoNota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampoDocumento" ADD CONSTRAINT "CampoDocumento_campoId_fkey" FOREIGN KEY ("campoId") REFERENCES "Campo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampoFoto" ADD CONSTRAINT "CampoFoto_campoId_fkey" FOREIGN KEY ("campoId") REFERENCES "Campo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cultivo" ADD CONSTRAINT "Cultivo_campoId_fkey" FOREIGN KEY ("campoId") REFERENCES "Campo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CultivoHistorial" ADD CONSTRAINT "CultivoHistorial_cultivoId_fkey" FOREIGN KEY ("cultivoId") REFERENCES "Cultivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rendimiento" ADD CONSTRAINT "Rendimiento_campoId_fkey" FOREIGN KEY ("campoId") REFERENCES "Campo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rendimiento" ADD CONSTRAINT "Rendimiento_cultivoId_fkey" FOREIGN KEY ("cultivoId") REFERENCES "Cultivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rendimiento" ADD CONSTRAINT "Rendimiento_campaniaId_fkey" FOREIGN KEY ("campaniaId") REFERENCES "Campania"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AplicacionInsumo" ADD CONSTRAINT "AplicacionInsumo_campoId_fkey" FOREIGN KEY ("campoId") REFERENCES "Campo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AplicacionInsumo" ADD CONSTRAINT "AplicacionInsumo_cultivoId_fkey" FOREIGN KEY ("cultivoId") REFERENCES "Cultivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AplicacionInsumo" ADD CONSTRAINT "AplicacionInsumo_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AplicacionInsumo" ADD CONSTRAINT "AplicacionInsumo_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AplicacionInsumo" ADD CONSTRAINT "AplicacionInsumo_aplicadorId_fkey" FOREIGN KEY ("aplicadorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_campoId_fkey" FOREIGN KEY ("campoId") REFERENCES "Campo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_cultivoId_fkey" FOREIGN KEY ("cultivoId") REFERENCES "Cultivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TareaAdjunto" ADD CONSTRAINT "TareaAdjunto_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaFinanciera" ADD CONSTRAINT "CuentaFinanciera_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoFinanciero" ADD CONSTRAINT "MovimientoFinanciero_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "CuentaFinanciera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoFinanciero" ADD CONSTRAINT "MovimientoFinanciero_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaFinanciera"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoFinanciero" ADD CONSTRAINT "MovimientoFinanciero_centroCostoId_fkey" FOREIGN KEY ("centroCostoId") REFERENCES "CentroCosto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoFinanciero" ADD CONSTRAINT "MovimientoFinanciero_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoAdjunto" ADD CONSTRAINT "MovimientoAdjunto_movimientoId_fkey" FOREIGN KEY ("movimientoId") REFERENCES "MovimientoFinanciero"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCuentaCorriente" ADD CONSTRAINT "MovimientoCuentaCorriente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCuentaCorriente" ADD CONSTRAINT "MovimientoCuentaCorriente_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCuentaCorriente" ADD CONSTRAINT "MovimientoCuentaCorriente_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaAdjunto" ADD CONSTRAINT "FacturaAdjunto_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupLog" ADD CONSTRAINT "BackupLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmpresaConfig" ADD CONSTRAINT "EmpresaConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
