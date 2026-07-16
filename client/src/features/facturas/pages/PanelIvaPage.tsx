import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { facturasApi } from '../api/facturasApi';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { FullPageSpinner } from '@/components/Spinner';
import { getErrorMessage } from '@/lib/errors';

const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const inicioAnio = () => toDateStr(new Date(new Date().getFullYear(), 0, 1));
const hoy = () => toDateStr(new Date());

export const PanelIvaPage = () => {
  const [desde, setDesde] = useState(inicioAnio());
  const [hasta, setHasta] = useState(hoy());
  const [exportando, setExportando] = useState<'excel' | 'pdf' | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['facturas', 'iva', desde, hasta],
    queryFn: () => facturasApi.panelIva(desde, hasta),
  });

  const handleExport = async (formato: 'excel' | 'pdf') => {
    setExportando(formato);
    try {
      await facturasApi.exportarIva(desde, hasta, formato);
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo exportar el panel de IVA'));
    } finally {
      setExportando(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Panel IVA</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Débito fiscal, crédito fiscal y saldo técnico por mes
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Input label="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        <Input label="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        <Button
          variant="secondary"
          onClick={() => {
            setDesde(inicioAnio());
            setHasta(hoy());
          }}
        >
          Año actual
        </Button>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" onClick={() => handleExport('excel')} loading={exportando === 'excel'}>
            <ArrowDownTrayIcon className="h-4 w-4" /> Excel
          </Button>
          <Button variant="secondary" onClick={() => handleExport('pdf')} loading={exportando === 'pdf'}>
            <ArrowDownTrayIcon className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <FullPageSpinner />
      ) : !data || data.porMes.length === 0 ? (
        <EmptyState title="Sin facturas en este rango" description="Registrá facturas para ver el panel de IVA." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-xs text-gray-400">Débito fiscal (IVA Ventas)</p>
              <p className="text-xl font-semibold text-brand-700 dark:text-brand-300">
                $ {data.totales.debitoFiscal.toLocaleString('es-AR')}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-gray-400">Crédito fiscal (IVA Compras)</p>
              <p className="text-xl font-semibold text-red-600 dark:text-red-400">
                $ {data.totales.creditoFiscal.toLocaleString('es-AR')}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-gray-400">Saldo técnico</p>
              <p
                className={`text-xl font-semibold ${data.totales.saldoTecnico >= 0 ? 'text-red-600 dark:text-red-400' : 'text-brand-700 dark:text-brand-300'}`}
              >
                $ {data.totales.saldoTecnico.toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-gray-400">
                {data.totales.saldoTecnico >= 0 ? 'A pagar a AFIP' : 'Saldo a favor'}
              </p>
            </Card>
          </div>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Totales mensuales</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs uppercase text-gray-400 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-3 font-medium">Período</th>
                    <th className="px-4 py-3 font-medium">IVA Ventas</th>
                    <th className="px-4 py-3 font-medium">IVA Compras</th>
                    <th className="px-4 py-3 font-medium">Débito Fiscal</th>
                    <th className="px-4 py-3 font-medium">Crédito Fiscal</th>
                    <th className="px-4 py-3 font-medium">Saldo Técnico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.porMes.map((p) => (
                    <tr key={p.periodo}>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{p.periodo}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">$ {p.ivaVentas.toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">$ {p.ivaCompras.toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">$ {p.debitoFiscal.toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">$ {p.creditoFiscal.toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        $ {p.saldoTecnico.toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
