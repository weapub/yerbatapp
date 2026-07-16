import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { CamposListPage } from '@/features/campos/pages/CamposListPage';
import { CampoDetailPage } from '@/features/campos/pages/CampoDetailPage';
import { CultivosListPage } from '@/features/cultivos/pages/CultivosListPage';
import { RendimientosPage } from '@/features/rendimientos/pages/RendimientosPage';
import { FertilizantesPage } from '@/features/insumos/pages/FertilizantesPage';
import { HerbicidasPage } from '@/features/insumos/pages/HerbicidasPage';
import { ProveedoresListPage } from '@/features/proveedores/pages/ProveedoresListPage';
import { ProveedorDetailPage } from '@/features/proveedores/pages/ProveedorDetailPage';
import { TareasPage } from '@/features/tareas/pages/TareasPage';
import { FinanzasPage } from '@/features/finanzas/pages/FinanzasPage';
import { ClientesListPage } from '@/features/clientes/pages/ClientesListPage';
import { ClienteDetailPage } from '@/features/clientes/pages/ClienteDetailPage';
import { FacturacionPage } from '@/features/facturas/pages/FacturacionPage';
import { ReportesListPage } from '@/features/reportes/pages/ReportesListPage';
import { ReporteDetailPage } from '@/features/reportes/pages/ReporteDetailPage';
import { UsersPage } from '@/features/users/pages/UsersPage';
import { ConfiguracionPage } from '@/features/configuracion/pages/ConfiguracionPage';
import { NotFoundPage } from '@/app/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/campos', element: <CamposListPage /> },
          { path: '/campos/:id', element: <CampoDetailPage /> },
          { path: '/cultivos', element: <CultivosListPage /> },
          { path: '/rendimientos', element: <RendimientosPage /> },
          { path: '/fertilizantes', element: <FertilizantesPage /> },
          { path: '/herbicidas', element: <HerbicidasPage /> },
          { path: '/proveedores', element: <ProveedoresListPage /> },
          { path: '/proveedores/:id', element: <ProveedorDetailPage /> },
          { path: '/tareas', element: <TareasPage /> },
          { path: '/finanzas', element: <FinanzasPage /> },
          { path: '/clientes', element: <ClientesListPage /> },
          { path: '/clientes/:id', element: <ClienteDetailPage /> },
          { path: '/facturacion', element: <FacturacionPage /> },
          { path: '/reportes', element: <ReportesListPage /> },
          { path: '/reportes/:tipo', element: <ReporteDetailPage /> },
          { path: '/configuracion', element: <ConfiguracionPage /> },
          {
            element: <RoleGuard allow={['ADMIN']} />,
            children: [{ path: '/usuarios', element: <UsersPage /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
