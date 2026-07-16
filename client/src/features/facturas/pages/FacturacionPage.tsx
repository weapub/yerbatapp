import { useState } from 'react';
import clsx from 'clsx';
import { FacturasListPage } from './FacturasListPage';
import { PanelIvaPage } from './PanelIvaPage';

const TABS = [
  { key: 'facturas', label: 'Facturas' },
  { key: 'iva', label: 'Panel IVA' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export const FacturacionPage = () => {
  const [tab, setTab] = useState<TabKey>('facturas');

  return (
    <div className="flex flex-col gap-6">
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

      {tab === 'facturas' ? <FacturasListPage /> : <PanelIvaPage />}
    </div>
  );
};
