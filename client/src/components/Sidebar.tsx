import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import {
  Squares2X2Icon,
  MapIcon,
  SparklesIcon,
  UsersIcon,
  ChartBarIcon,
  BeakerIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  DocumentTextIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';

const primaryNav = [
  { to: '/', label: 'Dashboard', icon: Squares2X2Icon, end: true },
  { to: '/campos', label: 'Campos', icon: MapIcon },
  { to: '/cultivos', label: 'Cultivos', icon: SparklesIcon },
  { to: '/rendimientos', label: 'Rendimientos', icon: ChartBarIcon },
  { to: '/fertilizantes', label: 'Fertilizantes', icon: BeakerIcon },
  { to: '/herbicidas', label: 'Herbicidas', icon: BeakerIcon },
  { to: '/proveedores', label: 'Proveedores', icon: BuildingStorefrontIcon },
  { to: '/clientes', label: 'Clientes', icon: UserGroupIcon },
  { to: '/tareas', label: 'Tareas Agrícolas', icon: ClipboardDocumentListIcon },
  { to: '/finanzas', label: 'Finanzas', icon: BanknotesIcon },
  { to: '/facturacion', label: 'Facturación / IVA', icon: DocumentTextIcon },
  { to: '/reportes', label: 'Reportes', icon: DocumentChartBarIcon },
  { to: '/configuracion', label: 'Configuración', icon: Cog6ToothIcon },
];

const adminNav = [{ to: '/usuarios', label: 'Usuarios', icon: UsersIcon }];

export const Sidebar = () => {
  const rol = useAuthStore((s) => s.user?.rol);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const location = useLocation();

  // Cerrar el drawer al navegar (no tiene efecto en desktop, donde es estático).
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-brand-800 text-white'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
    );

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex h-full w-64 shrink-0 flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out dark:border-gray-800 dark:bg-gray-900',
          'lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-sm font-bold text-mate-400">
            Y
          </span>
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">YerbatApp</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {primaryNav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClasses}>
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}

          {rol === 'ADMIN' && (
            <>
              <p className="mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Administración</p>
              {adminNav.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClasses}>
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>
      </aside>
    </>
  );
};
