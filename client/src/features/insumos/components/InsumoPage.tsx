import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BeakerIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { insumosApi } from '../api/insumosApi';
import { AplicacionFormModal } from './AplicacionFormModal';
import { EstadisticasPanel } from './EstadisticasPanel';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { FullPageSpinner } from '@/components/Spinner';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/ResponsiveTable';
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth.store';
import { AplicacionInsumo, TipoInsumo } from '@/types/insumos';

interface InsumoPageProps {
  tipo: TipoInsumo;
  title: string;
  subtitle: string;
}

export const InsumoPage = ({ tipo, title, subtitle }: InsumoPageProps) => {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const rol = useAuthStore((s) => s.user?.rol);
  const canManage = rol === 'ADMIN' || rol === 'SUPERVISOR';
  const canDelete = rol === 'ADMIN';

  const { data, isLoading } = useQuery({
    queryKey: ['insumos', { tipo, page }],
    queryFn: () => insumosApi.list({ tipo, page, pageSize: 10 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => insumosApi.delete(id),
    onSuccess: () => {
      toast.success('Aplicación eliminada');
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const columns: ResponsiveTableColumn<AplicacionInsumo>[] = [
    { header: 'Fecha', cell: (a) => new Date(a.fecha).toLocaleDateString('es-AR') },
    {
      header: 'Campo',
      cell: (a) => <span className="font-medium text-gray-900 dark:text-gray-100">{a.campo.nombre}</span>,
    },
    { header: 'Cultivo', cell: (a) => a.cultivo.nombre },
    { header: 'Producto', cell: (a) => `${a.producto.nombre}${a.producto.marca ? ` (${a.producto.marca})` : ''}` },
    { header: 'Proveedor', cell: (a) => a.proveedor.empresa },
    { header: 'Dosis/ha', cell: (a) => a.dosisHa },
    { header: 'Costo', cell: (a) => `$ ${a.costo.toLocaleString('es-AR')}` },
    { header: 'Aplicador', cell: (a) => a.aplicador.nombre },
    ...(canDelete
      ? [
          {
            header: '',
            actions: true,
            cell: (a: AplicacionInsumo) => (
              <Button
                variant="ghost"
                onClick={() => {
                  if (confirm('¿Eliminar esta aplicación?')) deleteMutation.mutate(a.id);
                }}
              >
                <TrashIcon className="h-4 w-4 text-red-500" />
              </Button>
            ),
          } as ResponsiveTableColumn<AplicacionInsumo>,
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        {canManage && (
          <Button onClick={() => setModalOpen(true)}>
            <PlusIcon className="h-4 w-4" /> Nueva aplicación
          </Button>
        )}
      </div>

      <EstadisticasPanel tipo={tipo} />

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Historial de aplicaciones</h2>
        {isLoading ? (
          <FullPageSpinner />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            icon={<BeakerIcon className="h-10 w-10" />}
            title="No hay aplicaciones registradas todavía"
          />
        ) : (
          <>
            <ResponsiveTable data={data.data} rowKey={(a) => a.id} columns={columns} />

            <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>
                Página {data.meta.page} de {data.meta.totalPages} · {data.meta.total} registros
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

      <AplicacionFormModal open={modalOpen} onClose={() => setModalOpen(false)} tipo={tipo} />
    </div>
  );
};
