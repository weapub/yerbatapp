import { useState } from 'react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { EmpresaTab } from '../components/EmpresaTab';
import { ParametrosTab } from '../components/ParametrosTab';
import { BackupsTab } from '../components/BackupsTab';
import { useAuthStore } from '@/store/auth.store';

const TABS = [
  { key: 'empresa', label: 'Empresa' },
  { key: 'parametros', label: 'Parámetros' },
  { key: 'backups', label: 'Backups' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export const ConfiguracionPage = () => {
  const [tab, setTab] = useState<TabKey>('empresa');
  const rol = useAuthStore((s) => s.user?.rol);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Configuración</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Datos de la empresa, parámetros del sistema y backups
          {rol === 'ADMIN' && (
            <>
              {' '}
              · gestión de usuarios y roles en{' '}
              <Link to="/usuarios" className="text-brand-700 hover:underline dark:text-brand-300">
                Usuarios
              </Link>
            </>
          )}
        </p>
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

      {tab === 'empresa' && <EmpresaTab />}
      {tab === 'parametros' && <ParametrosTab />}
      {tab === 'backups' && <BackupsTab />}
    </div>
  );
};
