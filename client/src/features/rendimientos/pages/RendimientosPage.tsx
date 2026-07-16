import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ChartBarIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { rendimientosApi } from '../api/rendimientosApi';
import { campaniasApi } from '../api/campaniasApi';
import { RendimientoFormModal } from '../components/RendimientoFormModal';
import { CampaniaFormModal } from '../components/CampaniaFormModal';
import { ComparativaChart } from '../components/ComparativaChart';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Select } from '@/components/Select';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { FullPageSpinner, Spinner } from '@/components/Spinner';
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth.store';

export const RendimientosPage = () => {
  const [page, setPage] = useState(1);
  const [campaniaId, setCampaniaId] = useState('');
  const [rendimientoModalOpen, setRendimientoModalOpen] = useState(false);
  const [campaniaModalOpen, setCampaniaModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const rol = useAuthStore((s) => s.user?.rol);
  const canManage = rol === 'ADMIN' || rol === 'SUPERVISOR';
  const canDelete = rol === 'ADMIN';

  const { data: campanias, isLoading: campaniasLoading } = useQuery({
    queryKey: ['campanias'],
    queryFn: campaniasApi.list,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['rendimientos', { page, campaniaId }],
    queryFn: () => rendimientosApi.list({ page, pageSize: 10, campaniaId: campaniaId || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rendimientosApi.delete(id),
    onSuccess: () => {
      toast.success('Rendimiento eliminado');
      queryClient.invalidateQueries({ queryKey: ['rendimientos'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Rendimientos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Producción, costos e ingresos por campaña</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCampaniaModalOpen(true)}>
              <PlusIcon className="h-4 w-4" /> Nueva campaña
            </Button>
            <Button onClick={() => setRendimientoModalOpen(true)}>
              <PlusIcon className="h-4 w-4" /> Nuevo rendimiento
            </Button>
          </div>
        )}
      </div>

      <ComparativaChart />

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Historial de rendimientos</h2>
          {campaniasLoading ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Select
              className="w-56"
              value={campaniaId}
              onChange={(e) => {
                setCampaniaId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todas las campañas</option>
              {campanias?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          )}
        </div>

        {isLoading ? (
          <FullPageSpinner />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            icon={<ChartBarIcon className="h-10 w-10" />}
            title="No hay rendimientos registrados todavía"
            description="Registrá el primero desde el botón 'Nuevo rendimiento'."
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
                    <th className="px-4 py-3 font-medium">Campaña</th>
                    <th className="px-4 py-3 font-medium">Producción</th>
                    <th className="px-4 py-3 font-medium">Rinde/ha</th>
                    <th className="px-4 py-3 font-medium">Rentabilidad</th>
                    {canDelete && <th className="px-4 py-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.data.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {new Date(r.fecha).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{r.campo.nombre}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.cultivo.nombre}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.campania.nombre}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {r.produccion.toLocaleString('es-AR')} {r.unidad === 'KG' ? 'kg' : 't'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {r.rendimientoHa.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={r.rentabilidad >= 0 ? 'green' : 'red'}>
                          $ {r.rentabilidad.toLocaleString('es-AR')}
                        </Badge>
                      </td>
                      {canDelete && (
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              if (confirm('¿Eliminar este registro de rendimiento?')) deleteMutation.mutate(r.id);
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

      <RendimientoFormModal open={rendimientoModalOpen} onClose={() => setRendimientoModalOpen(false)} />
      <CampaniaFormModal open={campaniaModalOpen} onClose={() => setCampaniaModalOpen(false)} />
    </div>
  );
};
