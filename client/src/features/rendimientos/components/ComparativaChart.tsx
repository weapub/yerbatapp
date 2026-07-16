import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { rendimientosApi } from '../api/rendimientosApi';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { ComparativaGroupBy } from '@/types/rendimientos';

const GROUP_OPTIONS: { value: ComparativaGroupBy; label: string }[] = [
  { value: 'campania', label: 'Por campaña' },
  { value: 'campo', label: 'Por campo' },
  { value: 'cultivo', label: 'Por cultivo' },
];

export const ComparativaChart = () => {
  const [groupBy, setGroupBy] = useState<ComparativaGroupBy>('campania');

  const { data, isLoading } = useQuery({
    queryKey: ['rendimientos', 'comparativa', groupBy],
    queryFn: () => rendimientosApi.comparativa({ groupBy }),
  });

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Comparativa de rentabilidad</h2>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          {GROUP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setGroupBy(opt.value)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                groupBy === opt.value
                  ? 'bg-white text-brand-800 shadow-sm dark:bg-gray-700 dark:text-brand-300'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Sin datos suficientes para comparar" description="Registrá rendimientos para ver esta comparativa." />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => value.toLocaleString('es-AR')} />
            <Legend />
            <Bar dataKey="totalIngreso" name="Ingreso" fill="#4f9f68" radius={[4, 4, 0, 0]} />
            <Bar dataKey="totalCosto" name="Costo" fill="#dc2626" radius={[4, 4, 0, 0]} />
            <Bar dataKey="rentabilidad" name="Rentabilidad" fill="#0f3d2e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};
