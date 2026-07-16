import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  MapIcon,
  SparklesIcon,
  GlobeAmericasIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboardApi';
import { KpiCard } from '../components/KpiCard';
import { Card } from '@/components/Card';
import { FullPageSpinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';

const ESTADO_SANITARIO_COLORS: Record<string, string> = {
  EXCELENTE: '#26663c',
  BUENO: '#4f9f68',
  REGULAR: '#f59e0b',
  MALO: '#dc2626',
};

export const DashboardPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'resumen'],
    queryFn: dashboardApi.getResumen,
  });

  if (isLoading || !data) return <FullPageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Resumen general de la operación</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Campos" value={String(data.totalCampos)} icon={MapIcon} />
        <KpiCard
          label="Superficie total"
          value={`${data.superficieTotalHa.toLocaleString('es-AR')} ha`}
          icon={GlobeAmericasIcon}
        />
        <KpiCard label="Cultivos" value={String(data.totalCultivos)} icon={SparklesIcon} />
        <Link to="/tareas">
          <KpiCard label="Tareas pendientes" value={String(data.tareasPendientes)} icon={ClipboardDocumentListIcon} />
        </Link>
        <Link to="/tareas">
          <KpiCard
            label="Alertas"
            value={String(data.alertas)}
            icon={ExclamationTriangleIcon}
            hint="Vencidas o de alta prioridad"
          />
        </Link>
        <KpiCard
          label="Notas recientes"
          value={String(data.actividadReciente.length)}
          icon={ClockIcon}
          hint="Últimos 8 registros"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Superficie por campo (ha)</h2>
          {data.cultivosPorCampo.length === 0 ? (
            <EmptyState title="Todavía no hay campos cargados" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.cultivosPorCampo}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="superficieHa" fill="#26663c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Cultivos por estado sanitario
          </h2>
          {data.cultivosPorEstadoSanitario.length === 0 ? (
            <EmptyState title="Todavía no hay cultivos cargados" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.cultivosPorEstadoSanitario}
                  dataKey="cantidad"
                  nameKey="estado"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {data.cultivosPorEstadoSanitario.map((entry) => (
                    <Cell key={entry.estado} fill={ESTADO_SANITARIO_COLORS[entry.estado] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Actividad reciente</h2>
        {data.actividadReciente.length === 0 ? (
          <EmptyState title="Sin actividad reciente" description="Las notas creadas en los campos aparecerán acá" />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.actividadReciente.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{item.titulo}</p>
                  <p className="text-gray-500 dark:text-gray-400">
                    {item.campo} · {item.usuario}
                  </p>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(item.fecha).toLocaleDateString('es-AR')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};
