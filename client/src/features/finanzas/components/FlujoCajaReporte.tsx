import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { finanzasApi } from '../api/finanzasApi';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Spinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';

const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const inicioAnio = () => toDateStr(new Date(new Date().getFullYear(), 0, 1));
const hoy = () => toDateStr(new Date());

export const FlujoCajaReporte = () => {
  const [desde, setDesde] = useState(inicioAnio());
  const [hasta, setHasta] = useState(hoy());
  const [groupBy, setGroupBy] = useState<'dia' | 'mes'>('mes');

  const { data, isLoading } = useQuery({
    queryKey: ['finanzas', 'flujoCaja', desde, hasta, groupBy],
    queryFn: () => finanzasApi.flujoCaja(desde, hasta, groupBy),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Input label="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        <Input label="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        <Select label="Agrupar por" className="w-32" value={groupBy} onChange={(e) => setGroupBy(e.target.value as 'dia' | 'mes')}>
          <option value="mes">Mes</option>
          <option value="dia">Día</option>
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <Spinner />
        ) : !data || data.length === 0 ? (
          <EmptyState title="Sin movimientos en este rango" />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
              <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => `$ ${value.toLocaleString('es-AR')}`} />
              <Legend />
              <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#4f9f68" strokeWidth={2} />
              <Line type="monotone" dataKey="egresos" name="Egresos" stroke="#dc2626" strokeWidth={2} />
              <Line type="monotone" dataKey="saldoAcumulado" name="Saldo acumulado" stroke="#0f3d2e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
};
