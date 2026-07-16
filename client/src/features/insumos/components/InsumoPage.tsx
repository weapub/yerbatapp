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
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth.store';
import { TipoInsumo } from '@/types/insumos';

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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs uppercase text-gray-400 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Campo</th>
                    <th className="px-4 py-3 font-medium">Cultivo</th>
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium">Proveedor</th>
                    <th className="px-4 py-3 font-medium">Dosis/ha</th>
                    <th className="px-4 py-3 font-medium">Costo</th>
                    <th className="px-4 py-3 font-medium">Aplicador</th>
                    {canDelete && <th className="px-4 py-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.data.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {new Date(a.fecha).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{a.campo.nombre}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.cultivo.nombre}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {a.producto.nombre} {a.producto.marca && `(${a.producto.marca})`}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.proveedor.empresa}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.dosisHa}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        $ {a.costo.toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.aplicador.nombre}</td>
                      {canDelete && (
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              if (confirm('¿Eliminar esta aplicación?')) deleteMutation.mutate(a.id);
                            }}
                          >
                            <TrashIcon className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
