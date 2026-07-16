import { useNavigate } from 'react-router-dom';
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { ThemeToggle } from './ThemeToggle';
import { NotificacionesBell } from '@/features/notificaciones/components/NotificacionesBell';
import { api } from '@/lib/axios';

export const Topbar = () => {
  const navigate = useNavigate();
  const { user, refreshToken, clearSession } = useAuthStore();

  const handleLogout = async () => {
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch {
      // best-effort: igual cerramos la sesión local
    } finally {
      clearSession();
      toast.success('Sesión cerrada');
      navigate('/login');
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900">
      <div />
      <div className="flex items-center gap-4">
        <NotificacionesBell />
        <ThemeToggle />
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.nombre}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.rol}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar sesión"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
