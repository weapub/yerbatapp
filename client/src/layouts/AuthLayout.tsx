import { Outlet } from 'react-router-dom';

export const AuthLayout = () => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-4">
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-center gap-2 text-white">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl font-bold text-mate-400">
          Y
        </span>
        <h1 className="text-xl font-semibold">YerbatApp</h1>
        <p className="text-sm text-brand-100">Gestión integral agropecuaria</p>
      </div>
      <div className="card p-8">
        <Outlet />
      </div>
    </div>
  </div>
);
