import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { reportesApi } from '../api/reportesApi';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { FullPageSpinner } from '@/components/Spinner';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/ResponsiveTable';
import { getErrorMessage } from '@/lib/errors';
import { REPORTE_LABEL, REPORTES_CON_RANGO_OBLIGATORIO, REPORTES_SIN_FECHA, TipoReporte } from '@/types/reportes';

const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const inicioAnio = () => toDateStr(new Date(new Date().getFullYear(), 0, 1));
const hoy = () => toDateStr(new Date());

const formatCell = (key: string, value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  if (/fecha/i.test(key) && typeof value === 'string') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString('es-AR');
  }
  if (typeof value === 'number') return value.toLocaleString('es-AR');
  return String(value);
};

export const ReporteDetailPage = () => {
  const { tipo } = useParams<{ tipo: TipoReporte }>();
  const navigate = useNavigate();
  const tipoReporte = tipo as TipoReporte;
  const sinFecha = REPORTES_SIN_FECHA.includes(tipoReporte);
  const rangoObligatorio = REPORTES_CON_RANGO_OBLIGATORIO.includes(tipoReporte);

  const [desde, setDesde] = useState(rangoObligatorio ? inicioAnio() : '');
  const [hasta, setHasta] = useState(rangoObligatorio ? hoy() : '');
  const [exportando, setExportando] = useState<'csv' | 'excel' | 'pdf' | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reportes', tipoReporte, desde, hasta],
    queryFn: () => reportesApi.generar(tipoReporte, { desde: desde || undefined, hasta: hasta || undefined }),
    enabled: !rangoObligatorio || (Boolean(desde) && Boolean(hasta)),
  });

  const columns: ResponsiveTableColumn<Record<string, unknown>>[] =
    data?.columns.map((col) => ({
      header: col.header,
      cell: (row) => formatCell(col.key, row[col.key]),
    })) ?? [];

  const handleExport = async (formato: 'csv' | 'excel' | 'pdf') => {
    setExportando(formato);
    try {
      await reportesApi.exportar(tipoReporte, { desde: desde || undefined, hasta: hasta || undefined }, formato);
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo exportar el reporte'));
    } finally {
      setExportando(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => navigate('/reportes')}
        className="flex w-fit items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Volver a reportes
      </button>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {REPORTE_LABEL[tipoReporte] ?? tipoReporte}
          </h1>
          {data && <p className="text-sm text-gray-500 dark:text-gray-400">{data.rows.length} registros</p>}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {!sinFecha && (
            <>
              <Input label="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
              <Input label="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </>
          )}
          <Button variant="secondary" onClick={() => handleExport('csv')} loading={exportando === 'csv'}>
            <ArrowDownTrayIcon className="h-4 w-4" /> CSV
          </Button>
          <Button variant="secondary" onClick={() => handleExport('excel')} loading={exportando === 'excel'}>
            <ArrowDownTrayIcon className="h-4 w-4" /> Excel
          </Button>
          <Button variant="secondary" onClick={() => handleExport('pdf')} loading={exportando === 'pdf'}>
            <ArrowDownTrayIcon className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <Card className="p-3 sm:p-0">
        {isLoading ? (
          <FullPageSpinner />
        ) : !data || data.rows.length === 0 ? (
          <div className="p-3 sm:p-6">
            <EmptyState title="Sin datos para mostrar" description="Probá ajustar el rango de fechas." />
          </div>
        ) : (
          <ResponsiveTable data={data.rows} rowKey={(_, index) => String(index)} columns={columns} />
        )}
      </Card>
    </div>
  );
};
