import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { CalendarDaysIcon, CheckIcon, ClipboardDocumentListIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { tareasApi } from '../api/tareasApi';
import { TareaFormModal } from '../components/TareaFormModal';
import { TareaCalendar } from '../components/TareaCalendar';
import { SemaforoBadge } from '../components/SemaforoBadge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Select } from '@/components/Select';
import { EmptyState } from '@/components/EmptyState';
import { FullPageSpinner } from '@/components/Spinner';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/ResponsiveTable';
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth.store';
import { EstadoTarea, PrioridadTarea, Tarea, TIPO_TAREA_LABEL } from '@/types/tareas';

type SemaforoFiltro = 'ROJO' | 'AMARILLO' | 'VERDE' | '';

export const TareasPage = () => {
  const [vista, setVista] = useState<'lista' | 'calendario'>('lista');
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState<EstadoTarea | ''>('');
  const [prioridad, setPrioridad] = useState<PrioridadTarea | ''>('');
  const [semaforo, setSemaforo] = useState<SemaforoFiltro>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [seleccionada, setSeleccionada] = useState<Tarea | null>(null);
  const queryClient = useQueryClient();
  const rol = useAuthStore((s) => s.user?.rol);
  const canManage = rol === 'ADMIN' || rol === 'SUPERVISOR';
  const canDelete = rol === 'ADMIN';

  const { data, isLoading } = useQuery({
    queryKey: ['tareas', { page, estado, prioridad, semaforo }],
    queryFn: () =>
      tareasApi.list({
        page,
        pageSize: 10,
        estado: estado || undefined,
        prioridad: prioridad || undefined,
        semaforo: semaforo || undefined,
      }),
    enabled: vista === 'lista',
  });

  const invalidateTareas = () => {
    queryClient.invalidateQueries({ queryKey: ['tareas'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const completarMutation = useMutation({
    mutationFn: (id: string) =>
      tareasApi.update(id, { estado: 'COMPLETADA', fechaRealizada: new Date().toISOString().slice(0, 10) }),
    onSuccess: () => {
      toast.success('Tarea marcada como realizada');
      setSeleccionada(null);
      invalidateTareas();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tareasApi.delete(id),
    onSuccess: () => {
      toast.success('Tarea eliminada');
      setSeleccionada(null);
      invalidateTareas();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const columns: ResponsiveTableColumn<Tarea>[] = [
    { header: 'Semáforo', cell: (tarea) => <SemaforoBadge semaforo={tarea.semaforo} /> },
    {
      header: 'Tipo',
      cell: (tarea) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">{TIPO_TAREA_LABEL[tarea.tipo]}</span>
      ),
    },
    {
      header: 'Campo',
      cell: (tarea) => `${tarea.campo.nombre}${tarea.cultivo ? ` · ${tarea.cultivo.nombre}` : ''}`,
    },
    { header: 'Responsable', cell: (tarea) => tarea.responsable.nombre },
    { header: 'Programada', cell: (tarea) => new Date(tarea.fechaProgramada).toLocaleDateString('es-AR') },
    { header: 'Estado', cell: (tarea) => tarea.estado },
    {
      header: '',
      actions: true,
      cell: (tarea) => (
        <div className="flex justify-end gap-1">
          {tarea.estado !== 'COMPLETADA' && tarea.estado !== 'CANCELADA' && (
            <Button variant="ghost" onClick={() => completarMutation.mutate(tarea.id)} title="Marcar como realizada">
              <CheckIcon className="h-4 w-4 text-brand-600" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              onClick={() => {
                if (confirm('¿Eliminar esta tarea?')) deleteMutation.mutate(tarea.id);
              }}
            >
              <TrashIcon className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Tareas Agrícolas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gestión de tareas con semáforo de urgencia</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            <button
              onClick={() => setVista('lista')}
              className={clsx(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium',
                vista === 'lista'
                  ? 'bg-white text-brand-800 shadow-sm dark:bg-gray-700 dark:text-brand-300'
                  : 'text-gray-500 dark:text-gray-400',
              )}
            >
              <ClipboardDocumentListIcon className="h-4 w-4" /> Lista
            </button>
            <button
              onClick={() => setVista('calendario')}
              className={clsx(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium',
                vista === 'calendario'
                  ? 'bg-white text-brand-800 shadow-sm dark:bg-gray-700 dark:text-brand-300'
                  : 'text-gray-500 dark:text-gray-400',
              )}
            >
              <CalendarDaysIcon className="h-4 w-4" /> Calendario
            </button>
          </div>
          {canManage && (
            <Button onClick={() => setModalOpen(true)}>
              <PlusIcon className="h-4 w-4" /> Nueva tarea
            </Button>
          )}
        </div>
      </div>

      {vista === 'calendario' ? (
        <>
          <TareaCalendar onSelectTarea={setSeleccionada} />
          {seleccionada && (
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {TIPO_TAREA_LABEL[seleccionada.tipo]}
                    </h3>
                    <SemaforoBadge semaforo={seleccionada.semaforo} />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {seleccionada.campo.nombre} {seleccionada.cultivo && `· ${seleccionada.cultivo.nombre}`} ·{' '}
                    {seleccionada.responsable.nombre}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Programada: {new Date(seleccionada.fechaProgramada).toLocaleDateString('es-AR')}
                  </p>
                  {seleccionada.observaciones && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{seleccionada.observaciones}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {seleccionada.estado !== 'COMPLETADA' && seleccionada.estado !== 'CANCELADA' && (
                    <Button
                      variant="secondary"
                      onClick={() => completarMutation.mutate(seleccionada.id)}
                      loading={completarMutation.isPending}
                    >
                      <CheckIcon className="h-4 w-4" /> Marcar realizada
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (confirm('¿Eliminar esta tarea?')) deleteMutation.mutate(seleccionada.id);
                      }}
                    >
                      <TrashIcon className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <Select
              className="w-48"
              value={semaforo}
              onChange={(e) => {
                setSemaforo(e.target.value as SemaforoFiltro);
                setPage(1);
              }}
            >
              <option value="">Todos los semáforos</option>
              <option value="ROJO">🔴 Urgente / vencida</option>
              <option value="AMARILLO">🟡 Próxima a vencer</option>
              <option value="VERDE">🟢 En tiempo</option>
            </Select>
            <Select
              className="w-44"
              value={estado}
              onChange={(e) => {
                setEstado(e.target.value as EstadoTarea | '');
                setPage(1);
              }}
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROGRESO">En progreso</option>
              <option value="COMPLETADA">Completada</option>
              <option value="CANCELADA">Cancelada</option>
            </Select>
            <Select
              className="w-40"
              value={prioridad}
              onChange={(e) => {
                setPrioridad(e.target.value as PrioridadTarea | '');
                setPage(1);
              }}
            >
              <option value="">Toda prioridad</option>
              <option value="BAJA">Baja</option>
              <option value="MEDIA">Media</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </Select>
          </div>

          <Card>
            {isLoading ? (
              <FullPageSpinner />
            ) : !data || data.data.length === 0 ? (
              <EmptyState icon={<ClipboardDocumentListIcon className="h-10 w-10" />} title="No hay tareas con estos filtros" />
            ) : (
              <>
                <ResponsiveTable data={data.data} rowKey={(tarea) => tarea.id} columns={columns} />

                <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    Página {data.meta.page} de {data.meta.totalPages} · {data.meta.total} tareas
                  </span>
                  <div className="flex gap-2">
                    <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      Anterior
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={page >= data.meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </>
      )}

      <TareaFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};
