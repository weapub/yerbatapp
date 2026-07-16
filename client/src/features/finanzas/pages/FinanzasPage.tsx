import { useState } from 'react';
import clsx from 'clsx';
import { MovimientosPanel } from '../components/MovimientosPanel';
import { BalanceReporte } from '../components/BalanceReporte';
import { FlujoCajaReporte } from '../components/FlujoCajaReporte';
import { ConfiguracionPanel } from '../components/ConfiguracionPanel';

const TABS = [
  { key: 'movimientos', label: 'Movimientos' },
  { key: 'balance', label: 'Balance' },
  { key: 'flujo', label: 'Flujo de caja' },
  { key: 'configuracion', label: 'Cuentas y categorías' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export const FinanzasPage = () => {
  const [tab, setTab] = useState<TabKey>('movimientos');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Gestión Financiera</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Caja, bancos, movimientos y reportes</p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex gap-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                'border-b-2 px-1 pb-3 text-sm font-medium',
                tab === t.key
                  ? 'border-brand-800 text-brand-800 dark:border-brand-300 dark:text-brand-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'movimientos' && <MovimientosPanel />}
      {tab === 'balance' && <BalanceReporte />}
      {tab === 'flujo' && <FlujoCajaReporte />}
      {tab === 'configuracion' && <ConfiguracionPanel />}
    </div>
  );
};
