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
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/ResponsiveTable';
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

  const columns: ResponsiveTableColumn<Cultivo>[] = [
    {
      header: 'Nombre',
      cell: (cultivo) => <span className="font-medium text-gray-900 dark:text-gray-100">{cultivo.nombre}</span>,
    },
    {
      header: 'Campo',
      cell: (cultivo) =>
        cultivo.campo && (
          <Link to={`/campos/${cultivo.campo.id}`} className="text-brand-700 hover:underline dark:text-brand-300">
            {cultivo.campo.nombre}
          </Link>
        ),
    },
    {
      header: 'Plantación',
      cell: (cultivo) => new Date(cultivo.fechaPlantacion).toLocaleDateString('es-AR'),
    },
    { header: 'Plantas', cell: (cultivo) => cultivo.cantidadPlantas.toLocaleString('es-AR') },
    {
      header: 'Estado sanitario',
      cell: (cultivo) => <Badge tone={ESTADO_TONE[cultivo.estadoSanitario]}>{cultivo.estadoSanitario}</Badge>,
    },
  ];

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
          <Card className="p-3 sm:p-0">
            <ResponsiveTable data={data.data} rowKey={(cultivo) => cultivo.id} columns={columns} />
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
