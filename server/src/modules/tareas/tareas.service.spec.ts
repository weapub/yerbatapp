import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EstadoTarea, PrioridadTarea, TipoTarea } from '@prisma/client';

vi.mock('../../prisma/client', () => ({ prisma: {} }));

vi.mock('./tareas.repository', () => ({
  tareasRepository: {
    findManyPaginated: vi.fn(),
    findByIdInTenant: vi.fn(),
    findCampoInTenant: vi.fn(),
    findCultivoInCampo: vi.fn(),
    findUserInTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    addAdjunto: vi.fn(),
    findCalendario: vi.fn(),
  },
}));

import { tareasRepository } from './tareas.repository';
import { tareasService } from './tareas.service';

const tenantId = 'tenant-1';

const baseInput = {
  tipo: TipoTarea.PODA,
  campoId: 'campo-1',
  responsableId: 'user-1',
  fechaProgramada: new Date('2026-08-01'),
  prioridad: PrioridadTarea.MEDIA,
};

describe('tareasService.create', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rechaza crear la tarea si el campo no pertenece al tenant', async () => {
    vi.mocked(tareasRepository.findCampoInTenant).mockResolvedValue(null);

    await expect(tareasService.create(tenantId, baseInput)).rejects.toMatchObject({ statusCode: 404 });
    expect(tareasRepository.create).not.toHaveBeenCalled();
  });

  it('rechaza crear la tarea si el cultivo no pertenece al campo indicado', async () => {
    vi.mocked(tareasRepository.findCampoInTenant).mockResolvedValue({ id: 'campo-1' } as never);
    vi.mocked(tareasRepository.findCultivoInCampo).mockResolvedValue(null);

    await expect(
      tareasService.create(tenantId, { ...baseInput, cultivoId: 'cultivo-de-otro-campo' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rechaza crear la tarea si el responsable no existe en el tenant', async () => {
    vi.mocked(tareasRepository.findCampoInTenant).mockResolvedValue({ id: 'campo-1' } as never);
    vi.mocked(tareasRepository.findUserInTenant).mockResolvedValue(null);

    await expect(tareasService.create(tenantId, baseInput)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('incluye el semáforo calculado en la respuesta', async () => {
    vi.mocked(tareasRepository.findCampoInTenant).mockResolvedValue({ id: 'campo-1' } as never);
    vi.mocked(tareasRepository.findUserInTenant).mockResolvedValue({ id: 'user-1' } as never);
    vi.mocked(tareasRepository.create).mockResolvedValue({
      id: 'tarea-1',
      estado: EstadoTarea.PENDIENTE,
      prioridad: PrioridadTarea.URGENTE,
      fechaProgramada: new Date('2099-01-01'),
    } as never);

    const result = await tareasService.create(tenantId, { ...baseInput, prioridad: PrioridadTarea.URGENTE });

    expect(result.semaforo).toBe('ROJO');
  });
});

describe('tareasService.update', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lanza 404 al actualizar una tarea de otro tenant', async () => {
    vi.mocked(tareasRepository.findByIdInTenant).mockResolvedValue(null);

    await expect(tareasService.update('tarea-ajena', tenantId, { estado: EstadoTarea.COMPLETADA })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
