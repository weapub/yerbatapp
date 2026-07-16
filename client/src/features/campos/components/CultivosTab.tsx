import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PencilSquareIcon, PlusIcon, SparklesIcon, TrashIcon } from '@heroicons/react/24/outline';
import { cultivosApi } from '@/features/cultivos/api/cultivosApi';
import { CultivoFormModal } from '@/features/cultivos/components/CultivoFormModal';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { getErrorMessage } from '@/lib/errors';
import { Cultivo } from '@/types/campos';
import { useAuthStore } from '@/store/auth.store';

const ESTADO_TONE: Record<Cultivo['estadoSanitario'], 'green' | 'yellow' | 'red'> = {
  EXCELENTE: 'green',
  BUENO: 'green',
  REGULAR: 'yellow',
  MALO: 'red',
};

export const CultivosTab = ({ campoId }: { campoId: string }) => {
  const queryClient = useQueryClient();
  const [modalState, setModalState] = useState<{ open: boolean; cultivo: Cultivo | null }>({
    open: false,
    cultivo: null,
  });
  const rol = useAuthStore((s) => s.user?.rol);
  const canManage = rol === 'ADMIN' || rol === 'SUPERVISOR';

  const { data, isLoading } = useQuery({
    queryKey: ['cultivos', { campoId }],
    queryFn: () => cultivosApi.list({ campoId, pageSize: 50 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cultivosApi.delete(id),
    onSuccess: () => {
      toast.success('Cultivo eliminado');
      queryClient.invalidateQueries({ queryKey: ['cultivos'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="flex flex-col gap-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={() => setModalState({ open: true, cultivo: null })}>
            <PlusIcon className="h-4 w-4" /> Nuevo cultivo
          </Button>
        </div>
      )}

      {isLoading ? (
        <Spinner />
      ) : !data || data.data.length === 0 ? (
        <EmptyState icon={<SparklesIcon className="h-8 w-8" />} title="Sin cultivos registrados en este campo" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.data.map((cultivo) => (
            <Card key={cultivo.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{cultivo.nombre}</h4>
                  {cultivo.variedad && <p className="text-xs text-gray-400">{cultivo.variedad}</p>}
                </div>
                <Badge tone={ESTADO_TONE[cultivo.estadoSanitario]}>{cultivo.estadoSanitario}</Badge>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                <div>
                  <dt className="text-xs text-gray-400">Plantación</dt>
                  <dd>{new Date(cultivo.fechaPlantacion).toLocaleDateString('es-AR')}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Plantas</dt>
                  <dd>{cultivo.cantidadPlantas.toLocaleString('es-AR')}</dd>
                </div>
                {cultivo.produccionEsperadaKg && (
                  <div className="col-span-2">
                    <dt className="text-xs text-gray-400">Producción esperada</dt>
                    <dd>{cultivo.produccionEsperadaKg.toLocaleString('es-AR')} kg</dd>
                  </div>
                )}
              </dl>
              {canManage && (
                <div className="mt-3 flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                  <Button variant="ghost" onClick={() => setModalState({ open: true, cultivo })}>
                    <PencilSquareIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`¿Eliminar el cultivo "${cultivo.nombre}"?`)) deleteMutation.mutate(cultivo.id);
                    }}
                  >
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <CultivoFormModal
        open={modalState.open}
        onClose={() => setModalState({ open: false, cultivo: null })}
        campoId={campoId}
        cultivo={modalState.cultivo}
      />
    </div>
  );
};
