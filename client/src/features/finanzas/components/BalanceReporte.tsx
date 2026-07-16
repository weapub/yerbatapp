import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { finanzasApi } from '../api/finanzasApi';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';

const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const inicioMes = () => {
  const now = new Date();
  return toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
};
const inicioAnio = () => {
  const now = new Date();
  return toDateStr(new Date(now.getFullYear(), 0, 1));
};
const hoy = () => toDateStr(new Date());

export const BalanceReporte = () => {
  const [desde, setDesde] = useState(inicioMes());
  const [hasta, setHasta] = useState(hoy());

  const { data, isLoading } = useQuery({
    queryKey: ['finanzas', 'balance', desde, hasta],
    queryFn: () => finanzasApi.balance(desde, hasta),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Input label="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        <Input label="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        <Button
          variant="secondary"
          onClick={() => {
            setDesde(inicioMes());
            setHasta(hoy());
          }}
        >
          Mes actual
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setDesde(inicioAnio());
            setHasta(hoy());
          }}
        >
          Año actual
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data ? null : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-xs text-gray-400">Ingresos</p>
              <p className="text-xl font-semibold text-brand-700 dark:text-brand-300">
                $ {data.ingresos.toLocaleString('es-AR')}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-gray-400">Egresos</p>
              <p className="text-xl font-semibold text-red-600 dark:text-red-400">
                $ {data.egresos.toLocaleString('es-AR')}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-gray-400">Rentabilidad del período</p>
              <p
                className={`text-xl font-semibold ${data.rentabilidad >= 0 ? 'text-brand-700 dark:text-brand-300' : 'text-red-600 dark:text-red-400'}`}
              >
                $ {data.rentabilidad.toLocaleString('es-AR')}
              </p>
            </Card>
          </div>

          <Card>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Por categoría</h3>
            {data.porCategoria.length === 0 ? (
              <EmptyState title="Sin movimientos en este rango" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.porCategoria}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => `$ ${value.toLocaleString('es-AR')}`} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {data.porCategoria.map((entry) => (
                      <Cell key={entry.categoriaId} fill={entry.tipo === 'INGRESO' ? '#4f9f68' : '#dc2626'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </>
      )}
    </div>
  );
};
