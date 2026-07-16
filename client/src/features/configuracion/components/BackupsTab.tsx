import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import { backupsApi } from '../api/configuracionApi';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { FullPageSpinner } from '@/components/Spinner';
import { getErrorMessage } from '@/lib/errors';
import { BackupLog, EstadoBackup } from '@/types/configuracion';

const ESTADO_TONE: Record<EstadoBackup, 'green' | 'yellow' | 'red'> = {
  COMPLETADO: 'green',
  EN_PROGRESO: 'yellow',
  FALLIDO: 'red',
};

const formatBytes = (bytes: string | null) => {
  if (!bytes) return '—';
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

export const BackupsTab = () => {
  const queryClient = useQueryClient();
  const [restaurandoId, setRestaurandoId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['backups'], queryFn: backupsApi.list, refetchInterval: 15_000 });

  const crearMutation = useMutation({
    mutationFn: backupsApi.crear,
    onSuccess: () => {
      toast.success('Backup generado correctamente');
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo generar el backup')),
  });

  const restaurarMutation = useMutation({
    mutationFn: backupsApi.restaurar,
    onSuccess: () => toast.success('Base de datos restaurada'),
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo restaurar el backup')),
    onSettled: () => setRestaurandoId(null),
  });

  const handleRestaurar = (backup: BackupLog) => {
    const confirmado = confirm(
      `⚠️ ESTA ACCIÓN ES DESTRUCTIVA.\n\nVas a reemplazar TODOS los datos actuales de la base con el backup del ${new Date(backup.iniciadoEn).toLocaleString('es-AR')}.\n\nEsto no se puede deshacer. ¿Confirmás que querés continuar?`,
    );
    if (!confirmado) return;
    setRestaurandoId(backup.id);
    restaurarMutation.mutate(backup.id);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => crearMutation.mutate()} loading={crearMutation.isPending}>
          <PlusIcon className="h-4 w-4" /> Backup manual
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <FullPageSpinner />
        ) : !data || data.length === 0 ? (
          <EmptyState title="Sin backups todavía" description="Generá el primero con el botón de arriba." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase text-gray-400 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Tamaño</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {new Date(b.iniciadoEn).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{b.tipo}</td>
                  <td className="px-4 py-3">
                    <Badge tone={ESTADO_TONE[b.estado]}>{b.estado}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatBytes(b.tamanioBytes)}</td>
                  <td className="px-4 py-3">
                    {b.estado === 'COMPLETADO' && (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" onClick={() => backupsApi.descargar(b.id)} title="Descargar">
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleRestaurar(b)}
                          loading={restaurandoId === b.id}
                          title="Restaurar (destructivo)"
                        >
                          <ArrowPathIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};
