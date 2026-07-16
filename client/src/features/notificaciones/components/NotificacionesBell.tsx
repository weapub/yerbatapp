import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellIcon } from '@heroicons/react/24/outline';
import { notificacionesApi } from '../api/notificacionesApi';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { TipoNotificacion } from '@/types/notificaciones';

const TIPO_ICONO: Record<TipoNotificacion, string> = {
  VENCIMIENTO_FACTURA: '🧾',
  VENCIMIENTO_TAREA: '📋',
  APLICACION_AGRICOLA: '🌿',
  STOCK_BAJO: '📦',
  SISTEMA: 'ℹ️',
};

export const NotificacionesBell = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: noLeidas } = useQuery({
    queryKey: ['notificaciones', 'no-leidas'],
    queryFn: notificacionesApi.countNoLeidas,
    refetchInterval: 60_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['notificaciones', 'list'],
    queryFn: () => notificacionesApi.list(),
    enabled: open,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
  };

  const marcarLeidaMutation = useMutation({
    mutationFn: notificacionesApi.marcarLeida,
    onSuccess: invalidate,
  });

  const marcarTodasMutation = useMutation({
    mutationFn: notificacionesApi.marcarTodasLeidas,
    onSuccess: invalidate,
  });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
      >
        <BellIcon className="h-5 w-5" />
        {Boolean(noLeidas) && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {noLeidas! > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-4 z-20 mt-2 w-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:inset-x-auto sm:right-0 sm:w-80">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notificaciones</h3>
              {Boolean(noLeidas) && (
                <button
                  onClick={() => marcarTodasMutation.mutate()}
                  className="text-xs text-brand-700 hover:underline dark:text-brand-300"
                >
                  Marcar todas leídas
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4">
                  <Spinner />
                </div>
              ) : !data || data.data.length === 0 ? (
                <div className="p-4">
                  <EmptyState title="Sin notificaciones" />
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.data.map((n) => (
                    <li
                      key={n.id}
                      onClick={() => !n.leida && marcarLeidaMutation.mutate(n.id)}
                      className={`flex cursor-pointer gap-2 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                        n.leida ? 'opacity-60' : ''
                      }`}
                    >
                      <span>{TIPO_ICONO[n.tipo]}</span>
                      <div className="min-w-0">
                        <p className="text-gray-800 dark:text-gray-200">{n.mensaje}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {new Date(n.createdAt).toLocaleString('es-AR')}
                        </p>
                      </div>
                      {!n.leida && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
