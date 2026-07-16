import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EstadoTarea, PrioridadTarea } from '@prisma/client';

vi.mock('../../prisma/client', () => ({ prisma: {} }));

vi.mock('./notificaciones.repository', () => ({
  notificacionesRepository: {
    findTenantsActivos: vi.fn(),
    findTareasAbiertasConAlerta: vi.fn(),
    findFacturasPendientes: vi.fn(),
    findAdminsDeTenant: vi.fn(),
    existeNotificacionReciente: vi.fn(),
    create: vi.fn(),
    marcarFacturaVencida: vi.fn(),
  },
}));

import { notificacionesRepository } from './notificaciones.repository';
import { alertasService } from './alertas.service';

const tenantId = 'tenant-1';

const addDays = (days: number): Date => {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
};

describe('alertasService.generarAlertasAutomaticas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notificacionesRepository.findTenantsActivos).mockResolvedValue([{ id: tenantId }] as never);
    vi.mocked(notificacionesRepository.findAdminsDeTenant).mockResolvedValue([]);
    vi.mocked(notificacionesRepository.existeNotificacionReciente).mockResolvedValue(false);
  });

  it('crea una alerta para una tarea vencida y no para una en tiempo', async () => {
    vi.mocked(notificacionesRepository.findTareasAbiertasConAlerta).mockResolvedValue([
      {
        id: 'tarea-vencida',
        tipo: 'PODA',
        fechaProgramada: addDays(-2),
        prioridad: PrioridadTarea.MEDIA,
        estado: EstadoTarea.PENDIENTE,
        responsableId: 'user-1',
        campo: { nombre: 'Campo 1' },
      },
      {
        id: 'tarea-en-tiempo',
        tipo: 'RIEGO',
        fechaProgramada: addDays(30),
        prioridad: PrioridadTarea.BAJA,
        estado: EstadoTarea.PENDIENTE,
        responsableId: 'user-2',
        campo: { nombre: 'Campo 2' },
      },
    ] as never);
    vi.mocked(notificacionesRepository.findFacturasPendientes).mockResolvedValue([]);

    const result = await alertasService.generarAlertasAutomaticas();

    expect(result.notificacionesCreadas).toBe(1);
    expect(notificacionesRepository.create).toHaveBeenCalledOnce();
    expect(notificacionesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'VENCIMIENTO_TAREA', entidadId: 'tarea-vencida' }),
    );
  });

  it('clasifica una tarea de aplicación vencida como APLICACION_AGRICOLA', async () => {
    vi.mocked(notificacionesRepository.findTareasAbiertasConAlerta).mockResolvedValue([
      {
        id: 'tarea-aplicacion',
        tipo: 'APLICACION_FERTILIZANTE',
        fechaProgramada: addDays(-1),
        prioridad: PrioridadTarea.MEDIA,
        estado: EstadoTarea.PENDIENTE,
        responsableId: 'user-1',
        campo: { nombre: 'Campo 1' },
      },
    ] as never);
    vi.mocked(notificacionesRepository.findFacturasPendientes).mockResolvedValue([]);

    await alertasService.generarAlertasAutomaticas();

    expect(notificacionesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'APLICACION_AGRICOLA' }),
    );
  });

  it('no duplica una alerta si ya existe una reciente para la misma entidad', async () => {
    vi.mocked(notificacionesRepository.findTareasAbiertasConAlerta).mockResolvedValue([
      {
        id: 'tarea-vencida',
        tipo: 'PODA',
        fechaProgramada: addDays(-2),
        prioridad: PrioridadTarea.MEDIA,
        estado: EstadoTarea.PENDIENTE,
        responsableId: 'user-1',
        campo: { nombre: 'Campo 1' },
      },
    ] as never);
    vi.mocked(notificacionesRepository.findFacturasPendientes).mockResolvedValue([]);
    vi.mocked(notificacionesRepository.existeNotificacionReciente).mockResolvedValue(true);

    const result = await alertasService.generarAlertasAutomaticas();

    expect(result.notificacionesCreadas).toBe(0);
    expect(notificacionesRepository.create).not.toHaveBeenCalled();
  });

  it('marca como VENCIDA una factura pendiente con más de 30 días y notifica a los admins', async () => {
    vi.mocked(notificacionesRepository.findTareasAbiertasConAlerta).mockResolvedValue([]);
    vi.mocked(notificacionesRepository.findFacturasPendientes).mockResolvedValue([
      { id: 'factura-vieja', tipo: 'A', numero: '0001-1', fecha: addDays(-40), total: { toString: () => '10000' } as never },
      { id: 'factura-nueva', tipo: 'A', numero: '0001-2', fecha: addDays(-5), total: { toString: () => '5000' } as never },
    ] as never);
    vi.mocked(notificacionesRepository.findAdminsDeTenant).mockResolvedValue([{ id: 'admin-1' }] as never);

    const result = await alertasService.generarAlertasAutomaticas();

    expect(notificacionesRepository.marcarFacturaVencida).toHaveBeenCalledWith('factura-vieja');
    expect(notificacionesRepository.marcarFacturaVencida).not.toHaveBeenCalledWith('factura-nueva');
    expect(notificacionesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'VENCIMIENTO_FACTURA', entidadId: 'factura-vieja' }),
    );
    expect(result.notificacionesCreadas).toBe(1);
  });
});
