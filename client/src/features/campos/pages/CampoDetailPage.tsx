import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { camposApi } from '../api/camposApi';
import { CampoFormModal } from '../components/CampoFormModal';
import { CultivosTab } from '../components/CultivosTab';
import { NotasTab } from '../components/NotasTab';
import { DocumentosTab } from '../components/DocumentosTab';
import { FotosTab } from '../components/FotosTab';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { FullPageSpinner } from '@/components/Spinner';
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth.store';

const TABS = [
  { key: 'cultivos', label: 'Cultivos' },
  { key: 'notas', label: 'Notas' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'fotos', label: 'Fotos' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export const CampoDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>('cultivos');
  const [editOpen, setEditOpen] = useState(false);
  const rol = useAuthStore((s) => s.user?.rol);
  const canManage = rol === 'ADMIN' || rol === 'SUPERVISOR';
  const canDelete = rol === 'ADMIN';

  const { data: campo, isLoading } = useQuery({
    queryKey: ['campos', id],
    queryFn: () => camposApi.getById(id as string),
    enabled: Boolean(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => camposApi.delete(id as string),
    onSuccess: () => {
      toast.success('Campo eliminado');
      queryClient.invalidateQueries({ queryKey: ['campos'] });
      navigate('/campos');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (isLoading || !campo) return <FullPageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => navigate('/campos')}
        className="flex w-fit items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Volver a campos
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{campo.nombre}</h1>
            <Badge tone={campo.estado === 'ACTIVO' ? 'green' : 'gray'}>{campo.estado}</Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{campo.ubicacion}</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <PencilSquareIcon className="h-4 w-4" /> Editar
            </Button>
            {canDelete && (
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm(`¿Eliminar el campo "${campo.nombre}"? Esta acción no se puede deshacer.`)) {
                    deleteMutation.mutate();
                  }
                }}
                loading={deleteMutation.isPending}
              >
                <TrashIcon className="h-4 w-4" /> Eliminar
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-xs text-gray-400">Superficie</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {campo.superficieHa.toLocaleString('es-AR')} ha
          </p>
        </Card>
        <Card>
          <p className="text-xs text-gray-400">Responsable</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {campo.responsable?.nombre ?? '—'}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-gray-400">Cultivos</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{campo._count?.cultivos ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-400">Notas</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{campo._count?.notas ?? 0}</p>
        </Card>
      </div>

      {campo.observaciones && (
        <Card>
          <p className="text-xs font-semibold text-gray-400">Observaciones</p>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{campo.observaciones}</p>
        </Card>
      )}

      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex gap-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                'border-b-2 px-1 pb-3 text-sm font-medium',
                tab === t.key
                  ? 'border-brand-800 text-brand-800 dark:border-brand-300 dark:text-brand-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'cultivos' && <CultivosTab campoId={campo.id} />}
      {tab === 'notas' && <NotasTab campoId={campo.id} />}
      {tab === 'documentos' && <DocumentosTab campoId={campo.id} />}
      {tab === 'fotos' && <FotosTab campoId={campo.id} />}

      <CampoFormModal open={editOpen} onClose={() => setEditOpen(false)} campo={campo} />
    </div>
  );
};
