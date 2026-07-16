import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { OfflineBanner } from '@/components/OfflineBanner';

export const AppLayout = () => (
  <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
    <Sidebar />
    <div className="flex flex-1 flex-col overflow-hidden">
      <OfflineBanner />
      <Topbar />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  </div>
);
