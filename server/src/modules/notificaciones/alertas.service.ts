import { TipoNotificacion, TipoTarea } from '@prisma/client';
import { logger } from '../../config/logger';
import { hoyUTC } from '../../shared/utils/date';
import { calcularSemaforo } from '../tareas/tareas.semaforo';
import { notificacionesRepository } from './notificaciones.repository';

/** Ventana para no duplicar la misma alerta si el cron corre más de una vez por día. */
const VENTANA_DEDUPE_HORAS = 20;
/** Plazo por defecto para considerar vencida una factura PENDIENTE (no hay fecha de vencimiento explícita en el modelo). */
const DIAS_VENCIMIENTO_FACTURA = 30;

const TIPOS_APLICACION: TipoTarea[] = ['APLICACION_FERTILIZANTE', 'APLICACION_HERBICIDA'];

const dedupeDesde = () => new Date(Date.now() - VENTANA_DEDUPE_HORAS * 60 * 60 * 1000);

const generarAlertasTareas = async (tenantId: string): Promise<number> => {
  const tareas = await notificacionesRepository.findTareasAbiertasConAlerta(tenantId);
  const desde = dedupeDesde();
  let creadas = 0;

  for (const tarea of tareas) {
    const semaforo = calcularSemaforo(tarea);
    if (semaforo !== 'ROJO' && semaforo !== 'AMARILLO') continue;

    const yaExiste = await notificacionesRepository.existeNotificacionReciente(
      tarea.responsableId,
      'Tarea',
      tarea.id,
      desde,
    );
    if (yaExiste) continue;

    const esAplicacion = TIPOS_APLICACION.includes(tarea.tipo);
    const tipo: TipoNotificacion = esAplicacion ? 'APLICACION_AGRICOLA' : 'VENCIMIENTO_TAREA';
    const urgencia = semaforo === 'ROJO' ? 'urgente' : 'próxima a vencer';
    const fechaStr = tarea.fechaProgramada.toLocaleDateString('es-AR');

    await notificacionesRepository.create({
      tenant: { connect: { id: tenantId } },
      user: { connect: { id: tarea.responsableId } },
      tipo,
      mensaje: `Tarea ${urgencia} en ${tarea.campo.nombre}: programada para el ${fechaStr}`,
      entidadTipo: 'Tarea',
      entidadId: tarea.id,
    });
    creadas++;
  }

  return creadas;
};

const generarAlertasFacturas = async (tenantId: string): Promise<number> => {
  const facturas = await notificacionesRepository.findFacturasPendientes(tenantId);
  const hoy = hoyUTC();
  const desde = dedupeDesde();
  const admins = await notificacionesRepository.findAdminsDeTenant(tenantId);
  let creadas = 0;

  for (const factura of facturas) {
    const fechaLimite = new Date(factura.fecha);
    fechaLimite.setUTCDate(fechaLimite.getUTCDate() + DIAS_VENCIMIENTO_FACTURA);
    if (fechaLimite >= hoy) continue;

    await notificacionesRepository.marcarFacturaVencida(factura.id);

    for (const admin of admins) {
      const yaExiste = await notificacionesRepository.existeNotificacionReciente(
        admin.id,
        'Factura',
        factura.id,
        desde,
      );
      if (yaExiste) continue;

      await notificacionesRepository.create({
        tenant: { connect: { id: tenantId } },
        user: { connect: { id: admin.id } },
        tipo: 'VENCIMIENTO_FACTURA',
        mensaje: `Factura ${factura.tipo}-${factura.numero} vencida ($${Number(factura.total).toLocaleString('es-AR')})`,
        entidadTipo: 'Factura',
        entidadId: factura.id,
      });
      creadas++;
    }
  }

  return creadas;
};

/**
 * Genera alertas automáticas de vencimientos (tareas y facturas) para todos los
 * tenants activos. Pensado para correr por cron (ver config/scheduler.ts) y también
 * disponible manualmente vía POST /notificaciones/generar-alertas.
 *
 * Nota: el tipo STOCK_BAJO del enum no se genera automáticamente todavía porque el
 * sistema no modela stock/inventario de insumos (no hay cantidad-en-mano ni umbral
 * mínimo en el schema) — se deja preparado para cuando exista ese módulo.
 */
export const alertasService = {
  async generarAlertasAutomaticas(): Promise<{ notificacionesCreadas: number }> {
    const tenants = await notificacionesRepository.findTenantsActivos();
    let total = 0;

    for (const tenant of tenants) {
      try {
        total += await generarAlertasTareas(tenant.id);
        total += await generarAlertasFacturas(tenant.id);
      } catch (error) {
        logger.error({ error, tenantId: tenant.id }, 'Error generando alertas automáticas');
      }
    }

    logger.info({ notificacionesCreadas: total }, 'Generación de alertas automáticas completada');
    return { notificacionesCreadas: total };
  },
};
