import { tareasRepository } from '../tareas/tareas.repository';
import { dashboardRepository } from './dashboard.repository';

/**
 * KPIs del dashboard. Solo se calculan a partir de datos que ya existen
 * (Campos/Cultivos/Tareas). Los indicadores financieros (gastos, ingresos,
 * rentabilidad) se incorporan cuando se implemente ese módulo (ver roadmap
 * en docs/architecture.md) — no se fabrican valores.
 */
export const dashboardService = {
  async getResumen(tenantId: string) {
    const [totalCampos, superficie, totalCultivos, porEstadoSanitario, porEstadoCampo, porCampo, actividad, tareas] =
      await Promise.all([
        dashboardRepository.countCampos(tenantId),
        dashboardRepository.sumSuperficie(tenantId),
        dashboardRepository.countCultivos(tenantId),
        dashboardRepository.cultivosPorEstadoSanitario(tenantId),
        dashboardRepository.camposPorEstado(tenantId),
        dashboardRepository.cultivosPorCampo(tenantId),
        dashboardRepository.actividadReciente(tenantId),
        tareasRepository.countPendientesYAlertas(tenantId),
      ]);

    return {
      totalCampos,
      superficieTotalHa: Number(superficie._sum.superficieHa ?? 0),
      totalCultivos,
      tareasPendientes: tareas.pendientes,
      alertas: tareas.alertas,
      cultivosPorEstadoSanitario: porEstadoSanitario.map((row) => ({
        estado: row.estadoSanitario,
        cantidad: row._count._all,
      })),
      camposPorEstado: porEstadoCampo.map((row) => ({ estado: row.estado, cantidad: row._count._all })),
      cultivosPorCampo: porCampo.map((campo) => ({
        campoId: campo.id,
        nombre: campo.nombre,
        superficieHa: Number(campo.superficieHa),
        cantidadCultivos: campo._count.cultivos,
      })),
      actividadReciente: actividad.map((nota) => ({
        id: nota.id,
        titulo: nota.titulo,
        campo: nota.campo.nombre,
        usuario: nota.usuario.nombre,
        fecha: nota.createdAt,
      })),
      // Placeholders explícitos: se activan en fases futuras del roadmap.
      modulosPendientes: ['finanzas', 'facturacion'],
    };
  },
};
