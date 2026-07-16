import { Navigate, Outlet } from 'react-router-dom';
import { RolUsuario } from '@/types/auth';
import { useAuthStore } from '@/store/auth.store';

interface RoleGuardProps {
  allow: RolUsuario[];
}

export const RoleGuard = ({ allow }: RoleGuardProps) => {
  const rol = useAuthStore((s) => s.user?.rol);

  if (!rol || !allow.includes(rol)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
