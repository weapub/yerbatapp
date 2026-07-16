import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { insumosApi } from '../api/insumosApi';
import { Card } from '@/components/Card';
import { Spinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { TipoInsumo } from '@/types/insumos';

export const EstadisticasPanel = ({ tipo }: { tipo: TipoInsumo }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['insumos', 'estadisticas', tipo],
    queryFn: () => insumosApi.estadisticas({ tipo }),
  });

  if (isLoading) return <Spinner />;
  if (!data || (data.porCultivo.length === 0 && data.porAnio.length === 0)) {
    return (
      <Card>
        <EmptyState title="Sin datos suficientes para estadísticas" description="Registrá aplicaciones para ver promedios y costos." />
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      <Card>
        <p className="text-xs text-gray-400">Promedio por hectárea</p>
        <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {data.promedioDosisHa.toLocaleString('es-AR')}
        </p>
      </Card>
      <Card>
        <p className="text-xs text-gray-400">Costo total</p>
        <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          $ {data.costoTotal.toLocaleString('es-AR')}
        </p>
      </Card>
      <Card>
        <p className="text-xs text-gray-400">Costo promedio / ha</p>
        <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          $ {data.costoPromedioHa.toLocaleString('es-AR')}
        </p>
      </Card>
      <Card>
        <p className="text-xs text-gray-400">Cultivos con aplicaciones</p>
        <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{data.porCultivo.length}</p>
      </Card>

      <Card className="lg:col-span-2">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Promedio por cultivo</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.porCultivo}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
            <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="promedioDosisHa" name="Promedio/ha" fill="#4f9f68" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="lg:col-span-2">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Promedio anual</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.porAnio}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
            <XAxis dataKey="anio" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="costoTotal" name="Costo total" fill="#0f3d2e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
