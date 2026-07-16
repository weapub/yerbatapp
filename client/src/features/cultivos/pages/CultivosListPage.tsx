import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { cultivosApi } from '../api/cultivosApi';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Select } from '@/components/Select';
import { EmptyState } from '@/components/EmptyState';
import { FullPageSpinner } from '@/components/Spinner';
import { Button } from '@/components/Button';
import { Cultivo } from '@/types/campos';

const ESTADO_TONE: Record<Cultivo['estadoSanitario'], 'green' | 'yellow' | 'red'> = {
  EXCELENTE: 'green',
  BUENO: 'green',
  REGULAR: 'yellow',
  MALO: 'red',
};

export const CultivosListPage = () => {
  const [page, setPage] = useState(1);
  const [estadoSanitario, setEstadoSanitario] = useState<Cultivo['estadoSanitario'] | ''>('');

  const { data, isLoading } = useQuery({
    queryKey: ['cultivos', { page, estadoSanitario }],
    queryFn: () => cultivosApi.list({ page, pageSize: 15, estadoSanitario: estadoSanitario || undefined }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Cultivos</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Todos los cultivos de todos los campos</p>
      </div>

      <Select
        className="w-56"
        value={estadoSanitario}
        onChange={(e) => {
          setEstadoSanitario(e.target.value as typeof estadoSanitario);
          setPage(1);
        }}
      >
        <option value="">Todos los estados sanitarios</option>
        <option value="EXCELENTE">Excelente</option>
        <option value="BUENO">Bueno</option>
        <option value="REGULAR">Regular</option>
        <option value="MALO">Malo</option>
      </Select>

      {isLoading ? (
        <FullPageSpinner />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          icon={<SparklesIcon className="h-10 w-10" />}
          title="No hay cultivos cargados todavía"
          description="Los cultivos se crean desde el detalle de cada campo."
        />
      ) : (
        <>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase text-gray-400 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Campo</th>
                  <th className="px-4 py-3 font-medium">Plantación</th>
                  <th className="px-4 py-3 font-medium">Plantas</th>
                  <th className="px-4 py-3 font-medium">Estado sanitario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.data.map((cultivo) => (
                  <tr key={cultivo.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{cultivo.nombre}</td>
                    <td className="px-4 py-3">
                      {cultivo.campo && (
                        <Link
                          to={`/campos/${cultivo.campo.id}`}
                          className="text-brand-700 hover:underline dark:text-brand-300"
                        >
                          {cultivo.campo.nombre}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {new Date(cultivo.fechaPlantacion).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {cultivo.cantidadPlantas.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={ESTADO_TONE[cultivo.estadoSanitario]}>{cultivo.estadoSanitario}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>
              Página {data.meta.page} de {data.meta.totalPages} · {data.meta.total} cultivos
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
    </div>
  );
};
